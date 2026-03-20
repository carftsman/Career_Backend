// const prisma = require("../../prisma");
// const uploadToAzure = require("../../cloud/azureUpload");

// exports.updateProfile = async (req, res) => {
//     try {
//         const candidateId = req.user.id;
//         const data = req.body;

//         const files = req.files;

//         let photoUrl = null;
//         let certificateUrls = [];

//         //  PHOTO UPLOAD
//         if (files?.photo) {
//             const file = files.photo[0];
//             const fileName = `profile-${candidateId}-${Date.now()}-${file.originalname}`;
//             photoUrl = await uploadToAzure(file.buffer, fileName);
//         }

//         //  CERTIFICATES UPLOAD (MULTIPLE)
//         if (files?.certificates) {
//             for (const file of files.certificates) {
//                 const fileName = `cert-${candidateId}-${Date.now()}-${file.originalname}`;
//                 const url = await uploadToAzure(file.buffer, fileName);
//                 certificateUrls.push(url);
//             }
//         }

//         //  HELPER FUNCTION
//         const toArray = (field) => {
//             if (!field) return [];
//             return Array.isArray(field)
//                 ? field
//                 : field.split(",").map((s) => s.trim());
//         };

//         const profile = await prisma.candidateProfile.upsert({
//             where: { candidateId },

//             const updateData = {
//                 dob: data.dob ? new Date(data.dob) : undefined,
//                 gender: data.gender || undefined,

//                 address: data.address || undefined,
//                 city: data.city || undefined,
//                 state: data.state || undefined,
//                 country: data.country || undefined,

//                 photoUrl: photoUrl || undefined,

//                 certificateUrls:
//                     certificateUrls.length > 0 ? certificateUrls : undefined,

//                 qualification: data.qualification || undefined,
//                 degree: data.degree || undefined,
//                 university: data.university || undefined,

//                 graduationYear: data.graduationYear
//                     ? Number(data.graduationYear)
//                     : undefined,

//                 cgpa: data.cgpa ? Number(data.cgpa) : undefined,

//                 totalExperience: data.totalExperience
//                     ? Number(data.totalExperience)
//                     : undefined,

//                 currentCompany: data.currentCompany || undefined,
//                 currentRole: data.currentRole || undefined,
//                 previousCompanies: data.previousCompanies || undefined,

//                 // ONLY update if provided
//                 ...(data.skills && {
//                     skills: toArray(data.skills)
//                 }),

//                 ...(data.languages && {
//                     languages: toArray(data.languages)
//                 })
//             };

//             create: {
//                 candidateId,

//                 dob: data.dob ? new Date(data.dob) : null,
//                 gender: data.gender,
//                 address: data.address,
//                 city: data.city,
//                 state: data.state,
//                 country: data.country,

//                 photoUrl,
//                 certificateUrls: certificateUrls,

//                 qualification: data.qualification,
//                 degree: data.degree,
//                 university: data.university,
//                 graduationYear: data.graduationYear
//                     ? Number(data.graduationYear)
//                     : null,
//                 cgpa: data.cgpa ? Number(data.cgpa) : null,

//                 totalExperience: data.totalExperience
//                     ? Number(data.totalExperience)
//                     : null,
//                 currentCompany: data.currentCompany,
//                 currentRole: data.currentRole,
//                 previousCompanies: data.previousCompanies,

//                 skills: toArray(data.skills),
//                 languages: toArray(data.languages),
//             },
//         });

//         res.json({
//             message: "Profile updated successfully",
//             profile,
//         });
//     } catch (error) {
//         console.error("PROFILE UPDATE ERROR:", error);

//         res.status(500).json({
//             message: "Internal server error",
//         });
//     }
// };
const prisma = require("../../prisma");
const uploadToAzure = require("../../cloud/azureUpload");

exports.updateProfile = async (req, res) => {
  try {
    const candidateId = req.user.id;
    const data = req.body;
    const files = req.files;

    let photoUrl = null;
    let certificateUrls = [];

    //  PHOTO UPLOAD
    if (files?.photo) {
      const file = files.photo[0];
      const fileName = `profile-${candidateId}-${Date.now()}-${file.originalname}`;
      photoUrl = await uploadToAzure(file.buffer, fileName);
    }

    //  CERTIFICATES UPLOAD
    if (files?.certificates) {
      for (const file of files.certificates) {
        const fileName = `cert-${candidateId}-${Date.now()}-${file.originalname}`;
        const url = await uploadToAzure(file.buffer, fileName);
        certificateUrls.push(url);
      }
    }

    //  HELPER FUNCTION
    const toArray = (field) => {
      if (!field) return [];
      return Array.isArray(field)
        ? field
        : field.split(",").map((s) => s.trim());
    };

    // SAFE PARTIAL UPDATE OBJECT
    const updateData = {
      dob: data.dob ? new Date(data.dob) : undefined,
      gender: data.gender || undefined,

      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      country: data.country || undefined,

      photoUrl: photoUrl || undefined,

      certificateUrls:
        certificateUrls.length > 0 ? certificateUrls : undefined,

      qualification: data.qualification || undefined,
      degree: data.degree || undefined,
      university: data.university || undefined,

      graduationYear: data.graduationYear
        ? Number(data.graduationYear)
        : undefined,

      cgpa: data.cgpa ? Number(data.cgpa) : undefined,

      totalExperience: data.totalExperience
        ? Number(data.totalExperience)
        : undefined,

      currentCompany: data.currentCompany || undefined,
      currentRole: data.currentRole || undefined,
      previousCompanies: data.previousCompanies || undefined,

      //  Only update if provided
      ...(data.skills && {
        skills: toArray(data.skills),
      }),

      ...(data.languages && {
        languages: toArray(data.languages),
      }),
    };

    // UPSERT PROFILE
    const profile = await prisma.candidateProfile.upsert({
      where: { candidateId },

      update: updateData,

      create: {
        candidateId,

        dob: data.dob ? new Date(data.dob) : null,
        gender: data.gender || null,

        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,

        photoUrl,
        certificateUrls,

        qualification: data.qualification || null,
        degree: data.degree || null,
        university: data.university || null,

        graduationYear: data.graduationYear
          ? Number(data.graduationYear)
          : null,

        cgpa: data.cgpa ? Number(data.cgpa) : null,

        totalExperience: data.totalExperience
          ? Number(data.totalExperience)
          : null,

        currentCompany: data.currentCompany || null,
        currentRole: data.currentRole || null,
        previousCompanies: data.previousCompanies || null,

        skills: toArray(data.skills),
        languages: toArray(data.languages),
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