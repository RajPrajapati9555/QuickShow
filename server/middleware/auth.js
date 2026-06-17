import { clerkClient } from "@clerk/express";

export const protectAdmin = async (req, res, next) => {
  try {
    const authState = typeof req.auth === "function" ? req.auth() : req.auth;
    const userId = authState?.userId;
    
    if (!userId) {
      console.log("Auth Debug:");
      console.log("Headers Authorization:", req.headers.authorization?.substring(0, 20) + "...");
      console.log("req.auth object/function:", req.auth);
      console.log("Evaluated authState:", authState);
      
      return res.json({ success: false, message: "not authenticated" });
    }

    const user = await clerkClient.users.getUser(userId);
    const role = user?.publicMetadata?.role || user?.privateMetadata?.role || user?.unsafeMetadata?.role;
    console.log("User metadata:", { 
       public: user?.publicMetadata, 
       private: user?.privateMetadata, 
       unsafe: user?.unsafeMetadata 
    });
    console.log("Resolved role:", role);

    if (!role || String(role).trim().toLowerCase() !== "admin") {
      return res.json({ success: false, message: "not authorized" });
    }
    next();
  } catch (error) {
    console.error("ProtectAdmin Error:", error);
    return res.json({ success: false, message: "not authorized" });
  }
};
