import * as profileService from "../services/profile.service.js";
import fs from "fs";
import path from "path";

const avatarFolder = path.resolve("uploads/avatars");
if (!fs.existsSync(avatarFolder)) {
  fs.mkdirSync(avatarFolder, { recursive: true });
}

export async function show(req, res) {
  try {
    // 🛡️ VACINA 2: Aceita o ID independentemente de como o authMiddleware o devolva
    const userId = req.userId || (req.user && req.user.id);

    const user = await profileService.getProfile(userId);
    return res.json(user);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function update(req, res) {
  try {
    const userId = req.userId || (req.user && req.user.id);

    // Se o multer processou o arquivo, salvamos com o caminho correto
    let avatarPath = undefined;
    if (req.file) {
      avatarPath = `/uploads/avatars/${req.file.filename}`;
    }

    const updatedUser = await profileService.updateProfile(
      userId,
      req.body,
      avatarPath,
    );
    return res.json(updatedUser);
  } catch (err) {
    console.error("Erro no ProfileController:", err); // Isso vai aparecer nos logs do Render!
    return res.status(500).json({ error: err.message });
  }
}