export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  const { checkDeployment } = await import("./app/_lib/deployment")

  for (const { nivel, mensagem } of checkDeployment()) {
    const prefixo = nivel === "erro" ? "[config: ERRO]" : "[config: aviso]"
    if (nivel === "erro") {
      console.error(prefixo, mensagem)
    } else {
      console.warn(prefixo, mensagem)
    }
  }

  // Só com a senha definida de propósito: nenhuma conta com senha padrão nasce
  // sozinha ao subir o servidor.
  if (process.env.SUPER_ADMIN_PASSWORD) {
    try {
      const [{ db }, { ensureSuperAdmin }] = await Promise.all([
        import("./app/_lib/prisma"),
        import("./prisma/super-admin"),
      ])
      const result = await ensureSuperAdmin(db)
      if (result.status !== "unchanged") {
        console.info(`[super-admin] ${result.email}: ${result.status}`)
      }
    } catch (erro) {
      console.error("[super-admin] não foi possível garantir a conta:", erro)
    }
  }
}
