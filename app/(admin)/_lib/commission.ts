// Divisão de um atendimento entre o barbeiro e a barbearia. Trabalha em
// centavos inteiros para que as duas partes sempre somem o valor cobrado.
export const splitCommission = (price: number, percent: number) => {
  const totalCents = Math.round(price * 100)
  const barberCents = Math.round((totalCents * percent) / 100)

  return {
    charged: totalCents / 100,
    commission: barberCents / 100,
    house: (totalCents - barberCents) / 100,
  }
}
