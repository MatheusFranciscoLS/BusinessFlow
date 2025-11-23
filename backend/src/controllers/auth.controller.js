import * as authService from "../services/auth.service.js";
import { z } from "zod";

export async function register(req, res) {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json(result);
  } catch (error) {
    // Tratamento específico para erros de validação do Zod
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Erro de validação", 
        details: error.errors.map(e => e.message) 
      });
    }
    return res.status(400).json({ error: error.message });
  }
}

export async function login(req, res) {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Dados inválidos", 
        details: error.errors.map(e => e.message) 
      });
    }
    // Erro 401 para credenciais inválidas é o padrão HTTP correto
    return res.status(401).json({ error: error.message });
  }
}

export async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }
}

export async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    return res.status(200).json({ message: "Logout realizado com sucesso" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

export async function forgotPassword(req, res) {
  console.log("🔍 CONTROLLER: Recebi pedido de esqueci senha:", req.body); // <--- LOG NOVO

  try {
    const { email } = req.body;
    await authService.sendForgotPasswordEmail(email);
    return res.json({ message: "Email de recuperação enviado!" });
  } catch (error) {
    console.error("❌ ERRO NO CONTROLLER:", error.message); // <--- LOG DE ERRO
    return res.status(400).json({ error: error.message });
  }
}

export async function resetPassword(req, res) {
  try {
    const { email, token, newPassword } = req.body;
    await authService.resetPassword(email, token, newPassword);
    return res.json({ message: "Senha atualizada!" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}