import * as profileService from "../services/profile.service.js";

export async function show(req, res) {
  try {
    const user = await profileService.getProfile(req.user.id);
    return res.json(user);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

export async function update(req, res) {
  try {
    const userId = req.user.id;
    // Se houver upload de ficheiro, captura o caminho relativo
    const avatarPath = req.file
      ? `/uploads/products/${req.file.filename}`
      : undefined;

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
