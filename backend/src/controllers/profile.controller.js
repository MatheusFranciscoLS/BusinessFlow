import * as profileService from "../services/profile.service.js";
import fs from "fs";

// 🛡️ VACINA 1: Se a pasta de uploads não existir no Render, nós criamos agora!
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
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

    // Captura o caminho da foto se ela foi enviada pelo Multer
    const avatarPath = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updatedUser = await profileService.updateProfile(
      userId,
      req.body,
      avatarPath,
    );
    return res.json(updatedUser);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
