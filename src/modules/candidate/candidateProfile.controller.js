
const prisma = require("../../prisma");
const uploadToAzure = require("../../cloud/azureUpload");

exports.updateProfile = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const data = req.body;
    const files = req.files;

    let photoUrl = null;
    let certificateUrls = [];

    //  FILE UPLOADS
    if (files?.photo) {
      const file = files.photo[0];
      const fileName = `profile-${candidateId}-${Date.now()}-${file.originalname}`;
      photoUrl = await uploadToAzure(file.buffer, fileName);
    }

    if (files?.certificates) {
      for (const file of files.certificates) {
        const fileName = `cert-${candidateId}-${Date.now()}-${file.originalname}`;
        const url = await uploadToAzure(file.buffer, fileName);
        certificateUrls.push(url);
      }
    }

    //  SAFE VALUE (CORE FIX)
    const safeValue = (val) => {
      return val && val !== "string" && val !== "" ? val : undefined;
    };

    //  ARRAY PARSER (FIXED)
    const toArray = (field) => {
      if (!field || field === "string") return undefined; // important for update
      return Array.isArray(field)
        ? field
        : field.split(",").map((s) => s.trim());
    };
    //  UPDATE DATA (only provided fields will update)
    const updateData = {
      dob: data.dob ? new Date(data.dob) : undefined,

      gender: safeValue(data.gender),
      address: safeValue(data.address),
      city: safeValue(data.city),
      state: safeValue(data.state),
      country: safeValue(data.country),

      photoUrl: photoUrl || undefined,
      certificateUrls:
        certificateUrls.length > 0 ? certificateUrls : undefined,

      qualification: safeValue(data.qualification),
      degree: safeValue(data.degree),
      university: safeValue(data.university),

      graduationYear: data.graduationYear
        ? Number(data.graduationYear)
        : undefined,

      cgpa: data.cgpa ? Number(data.cgpa) : undefined,

      totalExperience: data.totalExperience
        ? Number(data.totalExperience)
        : undefined,

      currentCompany: safeValue(data.currentCompany),
      currentRole: safeValue(data.currentRole),
      previousCompanies: safeValue(data.previousCompanies),

      ...(toArray(data.skills) && { skills: toArray(data.skills) }),
      ...(toArray(data.languages) && { languages: toArray(data.languages) }),
    };

    //  UPSERT PROFILE
    const profile = await prisma.candidateProfile.upsert({
      where: { candidateId },

      update: updateData,

      create: {
        candidateId,

        dob: data.dob ? new Date(data.dob) : null,

        gender: safeValue(data.gender) ?? null,
        address: safeValue(data.address) ?? null,
        city: safeValue(data.city) ?? null,
        state: safeValue(data.state) ?? null,
        country: safeValue(data.country) ?? null,

        photoUrl,
        certificateUrls,

        qualification: safeValue(data.qualification) ?? null,
        degree: safeValue(data.degree) ?? null,
        university: safeValue(data.university) ?? null,

        graduationYear: data.graduationYear
          ? Number(data.graduationYear)
          : null,

        cgpa: data.cgpa ? Number(data.cgpa) : null,

        totalExperience: data.totalExperience
          ? Number(data.totalExperience)
          : null,

        currentCompany: safeValue(data.currentCompany) ?? null,
        currentRole: safeValue(data.currentRole) ?? null,
        previousCompanies: safeValue(data.previousCompanies) ?? null,

        skills: toArray(data.skills) || [],
        languages: toArray(data.languages) || [],
      },
    });

    res.json({
      message: "Profile updated successfully",
      profile,
    });

  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};