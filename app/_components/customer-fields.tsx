"use client"

import type { CustomerInput } from "../_lib/customer-schema"
import { Input } from "./ui/input"

interface CustomerFieldsProps {
  value: Required<CustomerInput>
  // eslint-disable-next-line no-unused-vars
  onChange: (value: Required<CustomerInput>) => void
  idPrefix: string
  disabled?: boolean
}

const CustomerFields = ({
  value,
  onChange,
  idPrefix,
  disabled,
}: CustomerFieldsProps) => {
  const set = (field: keyof CustomerInput, text: string) =>
    onChange({ ...value, [field]: text })

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-nome`} className="text-sm font-medium">
          Nome *
        </label>
        <Input
          id={`${idPrefix}-nome`}
          autoComplete="name"
          placeholder="Seu nome"
          maxLength={80}
          value={value.name}
          disabled={disabled}
          onChange={(event) => set("name", event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-telefone`} className="text-sm font-medium">
          Telefone com WhatsApp *
        </label>
        <Input
          id={`${idPrefix}-telefone`}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 99999-9999"
          value={value.phone}
          disabled={disabled}
          onChange={(event) => set("phone", event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-email`} className="text-sm font-medium">
          E-mail <span className="text-muted-foreground">(opcional)</span>
        </label>
        <Input
          id={`${idPrefix}-email`}
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          maxLength={120}
          value={value.email}
          disabled={disabled}
          onChange={(event) => set("email", event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`${idPrefix}-aniversario`}
          className="text-sm font-medium"
        >
          Data de aniversário{" "}
          <span className="text-muted-foreground">(opcional)</span>
        </label>
        <Input
          id={`${idPrefix}-aniversario`}
          type="date"
          autoComplete="bday"
          min="1900-01-01"
          max={new Date().toISOString().slice(0, 10)}
          value={value.birthDate}
          disabled={disabled}
          onChange={(event) => set("birthDate", event.target.value)}
        />
      </div>
    </div>
  )
}

export default CustomerFields
