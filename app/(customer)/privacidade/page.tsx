import type { Metadata } from "next"
import InstitutionalPage, {
  Section,
} from "@/app/(customer)/_components/institutional-page"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Política de Privacidade | Barber Lab",
  description:
    "Quais dados o Barber Lab coleta, para que usa, com quem compartilha e como você exerce seus direitos previstos na LGPD.",
}

const Privacidade = () => {
  return (
    <InstitutionalPage
      eyebrow="Legal"
      title="Política de Privacidade"
      description="O que coletamos, por que coletamos e o que você pode exigir de nós."
      updatedAt="5 de setembro de 2026"
    >
      <Section title="Quem trata seus dados">
        <p>
          O Barber Lab é o controlador dos dados tratados na plataforma. Para
          qualquer assunto relacionado a esta política, incluindo pedidos sobre
          seus dados, escreva para{" "}
          <a
            href="mailto:lptech.contato.labs@gmail.com"
            className="text-primary hover:underline"
          >
            lptech.contato.labs@gmail.com
          </a>
          .
        </p>
        <p>
          A barbearia em que você agenda é controladora dos dados do atendimento
          dela. Ao marcar um horário, seus dados de contato ficam visíveis para
          aquela barbearia.
        </p>
      </Section>

      <Section title="Dados que coletamos">
        <p>
          <strong className="text-foreground">Ao agendar:</strong> nome e
          telefone (obrigatórios) e, se você quiser, e-mail e data de
          aniversário. Você não precisa criar conta.
        </p>
        <p>
          <strong className="text-foreground">
            Do cadastro de barbearias e equipes:
          </strong>{" "}
          nome, e-mail, telefone e senha de acesso ao painel, além dos dados da
          empresa (como cidade e CPF ou CNPJ, quando informado). A senha é
          guardada de forma criptografada e não conseguimos vê-la.
        </p>
        <p>
          <strong className="text-foreground">Dos seus agendamentos:</strong>{" "}
          serviço escolhido, data, horário, barbearia e situação do atendimento.
        </p>
        <p>
          Não coletamos dados de pagamento: os atendimentos são pagos
          presencialmente, direto com a barbearia.
        </p>
      </Section>

      <Section title="Para que usamos">
        <p>
          Para registrar e exibir seus agendamentos, permitir que a barbearia
          organize a agenda e para contato relacionado a um horário marcado. Não
          vendemos seus dados nem os usamos para publicidade de terceiros.
        </p>
      </Section>

      <Section title="Com quem compartilhamos">
        <p>
          Com a barbearia do seu agendamento (nome, e-mail, telefone se
          informado, e os dados da reserva) e com os provedores de
          infraestrutura necessários para o sistema funcionar: Vercel, para
          hospedagem; e Neon, para o banco de dados.
        </p>
        <p>
          Ao usar o botão de WhatsApp, a mensagem é aberta no seu próprio
          aplicativo. Não enviamos mensagens no seu nome e não integramos sua
          conta do WhatsApp ao sistema.
        </p>
      </Section>

      <Section title="Por quanto tempo guardamos">
        <p>
          Enquanto sua conta existir. O histórico de atendimentos é mantido
          também pela barbearia, que pode ter obrigações próprias de guarda.
          Quando você pede a exclusão, apagamos os dados que não somos obrigados
          a reter por lei.
        </p>
      </Section>

      <Section title="Seus direitos">
        <p>
          A LGPD garante que você peça confirmação de tratamento, acesso,
          correção, anonimização, portabilidade e exclusão dos seus dados, além
          de informação sobre com quem os compartilhamos. Para exercer qualquer
          um deles, escreva para o e-mail acima. Respondemos em até 15 dias.
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          Usamos apenas o necessário para manter você conectado e medir
          desempenho. O detalhamento está na{" "}
          <Link href="/cookies" className="text-primary hover:underline">
            Política de Cookies
          </Link>
          .
        </p>
      </Section>

      <Section title="Mudanças nesta política">
        <p>
          Se ela mudar, atualizamos a data no topo desta página. Alterações
          relevantes são avisadas dentro da plataforma.
        </p>
      </Section>
    </InstitutionalPage>
  )
}

export default Privacidade
