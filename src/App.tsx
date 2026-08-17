import { useState, type ChangeEvent, type FocusEvent, type FormEvent } from 'react'
import axios from 'axios'
import './App.css'

type DadosFormulario = {
  nomeCompleto: string
  dataNascimento: string
  sexoBiologico: string
  cpf: string
  cns: string
  tipoSanguineo: string
  alergias: string
  medicamentos: string
  historicoCirurgico: string
}

const dadosIniciais: DadosFormulario = {
  nomeCompleto: '',
  dataNascimento: '',
  sexoBiologico: '',
  cpf: '',
  cns: '',
  tipoSanguineo: '',
  alergias: '',
  medicamentos: '',
  historicoCirurgico: '',
}

const maskCPF = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

// maskPhone removed because phone fields were removed from the form

function App() {
  const [dadosFormulario, setDadosFormulario] = useState<DadosFormulario>(dadosIniciais)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [tocados, setTocados] = useState<Record<string, boolean>>({})
  const [enviado, setEnviado] = useState(false)
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [apiMessage, setApiMessage] = useState('')


  const validarCampo = (fieldName: string, values: DadosFormulario = dadosFormulario) => {
    switch (fieldName) {
      case 'nomeCompleto':
        return values.nomeCompleto.trim() ? '' : 'Informe o nome completo do paciente.'
      case 'dataNascimento':
        return values.dataNascimento ? '' : 'Selecione a data de nascimento.'
      case 'sexoBiologico':
        return values.sexoBiologico ? '' : 'Selecione o sexo biológico.'
      case 'cpf': {
        const cpfDigits = values.cpf.replace(/\D/g, '')
        return /^\d{11}$/.test(cpfDigits) ? '' : 'CPF inválido. Informe 11 dígitos.'
      }
      case 'cns': {
        const cnsDigits = values.cns.replace(/\D/g, '')
        return /^\d{15}$/.test(cnsDigits) ? '' : 'CNS inválido. Informe 15 dígitos.'
      }
      case 'tipoSanguineo':
        return values.tipoSanguineo ? '' : 'Selecione o tipo sanguíneo.'
      case 'alergias':
        return ''
      case 'medicamentos':
        return ''
      case 'historicoCirurgico':
        return ''
      default:
        return ''
    }
  }

  const tratarMudanca = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target

    const proximoValor = name === 'cpf' ? maskCPF(value) : value

    const proximoDados = { ...dadosFormulario, [name]: proximoValor }
    setDadosFormulario(proximoDados)

    if (tocados[name]) {
      setErros((prev) => ({ ...prev, [name]: validarCampo(name, proximoDados) }))
    } else {
      setErros((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const tratarBlur = (event: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = event.target
    setTocados((prev) => ({ ...prev, [name]: true }))
    setErros((prev) => ({ ...prev, [name]: validarCampo(name, dadosFormulario) }))
  }



  const validarFormulario = () => {
    const proximosErros: Record<string, string> = {}

    Object.keys(dadosFormulario).forEach((fieldName) => {
      const erro = validarCampo(fieldName, dadosFormulario)
      if (erro) {
        proximosErros[fieldName] = erro
      }
    })

    return proximosErros
  }

  const tratarEnvio = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const proximosErros = validarFormulario()

    if (Object.keys(proximosErros).length > 0) {
      setErros(proximosErros)
      setEnviado(false)
      return
    }

    setErros({})
    setApiStatus('loading')
    setApiMessage('')
    setEnviado(true)

    try {
      const payload = {
        ...dadosFormulario,
        cpf: dadosFormulario.cpf.replace(/\D/g, ''),
      }
      await axios.post('https://shf-open-api.onrender.com/pacientes', payload)
      setApiStatus('success')
      setApiMessage('Cadastro salvo com sucesso.')
    } catch (error: any) {
      setApiStatus('error')
      const msg = error?.response?.data?.message || error?.message || 'Erro ao salvar o cadastro.'
      setApiMessage(String(msg))
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Sistema hospitalar fictício</p>
          <h1>Cadastro de paciente</h1>
          <p className="hero-copy">
            Ao clicar no botão submit, faz uma requisição para salvar no servidor.
          </p>
        </div>
      </section>

      <form className="register-form" onSubmit={tratarEnvio} noValidate>
        <section className="section-card">
          <div className="section-header">
            <div>
              <h2>Identificação do paciente</h2>
            </div>
          </div>

          <div className="field-grid">
            <label className="field field-wide">
              <span>Nome completo *</span>
              <input name="nomeCompleto" value={dadosFormulario.nomeCompleto} onChange={tratarMudanca} onBlur={tratarBlur} placeholder="Ex.: Ana Beatriz Souza" />
              {erros.nomeCompleto && <small className="error-text">{erros.nomeCompleto}</small>}
            </label>

            <label className="field">
              <span>Data de nascimento *</span>
              <input type="date" name="dataNascimento" value={dadosFormulario.dataNascimento} onChange={tratarMudanca} onBlur={tratarBlur} />
              {erros.dataNascimento && <small className="error-text">{erros.dataNascimento}</small>}
            </label>

            <label className="field">
              <span>Sexo biológico *</span>
              <select name="sexoBiologico" value={dadosFormulario.sexoBiologico} onChange={tratarMudanca} onBlur={tratarBlur}>
                <option value="">Selecione</option>
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Não informado">Não informado</option>
              </select>
              {erros.sexoBiologico && <small className="error-text">{erros.sexoBiologico}</small>}
            </label>

            <label className="field">
              <span>CPF *</span>
              <input name="cpf" value={dadosFormulario.cpf} onChange={tratarMudanca} onBlur={tratarBlur} placeholder="000.000.000-00" maxLength={14} />
              {erros.cpf && <small className="error-text">{erros.cpf}</small>}
            </label>

            <label className="field">
              <span>CNS *</span>
              <input name="cns" value={dadosFormulario.cns} onChange={tratarMudanca} onBlur={tratarBlur} placeholder="000000000000000" maxLength={15} />
              {erros.cns && <small className="error-text">{erros.cns}</small>}
            </label>

            {/* Campo de foto removido */}
          </div>
        </section>

        {/* Dados de contato e Endereço removidos */}

        <section className="section-card">
          <div className="section-header">
            <div>
              <h2>Dados clínicos básicos</h2>
            </div>
          </div>

          <div className="field-grid">
            <label className="field field-wide">
              <span>Tipo sanguíneo *</span>
              <select name="tipoSanguineo" value={dadosFormulario.tipoSanguineo} onChange={tratarMudanca} onBlur={tratarBlur}>
                <option value="">Selecione</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
              {erros.tipoSanguineo && <small className="error-text">{erros.tipoSanguineo}</small>}
            </label>

            <label className="field field-wide">
              <span>Alergias</span>
              <textarea name="alergias" value={dadosFormulario.alergias} onChange={tratarMudanca} onBlur={tratarBlur} rows={3} placeholder="Ex.: Penicilina, poeira" />
            </label>

            {/* IMC, Doenças crônicas e Deficiências removidos */}

            <label className="field field-wide">
              <span>Medicamentos de uso contínuo</span>
              <textarea name="medicamentos" value={dadosFormulario.medicamentos} onChange={tratarMudanca} onBlur={tratarBlur} rows={3} placeholder="Ex.: Metformina, Losartana" />
            </label>

            <label className="field field-wide">
              <span>Histórico cirúrgico</span>
              <textarea name="historicoCirurgico" value={dadosFormulario.historicoCirurgico} onChange={tratarMudanca} onBlur={tratarBlur} rows={3} placeholder="Descreva intervenções anteriores" />
            </label>
          </div>
        </section>

        <div className="actions">
          <button className="submit-button" type="submit">
            Salvar cadastro
          </button>
          <span className="helper-text">Os campos marcados com * são obrigatórios.</span>
        </div>

        {enviado && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-window">
              {apiStatus === 'loading' && (
                <>
                  <h3>Salvando...</h3>
                  <p>Enviando dados para o servidor. Por favor, aguarde.</p>
                </>
              )}

              {apiStatus === 'success' && (
                <>
                  <h3>Sucesso</h3>
                  <p>{apiMessage}</p>
                </>
              )}

              {apiStatus === 'error' && (
                <>
                  <h3>Erro</h3>
                  <p>{apiMessage}</p>
                </>
              )}

              <div className="modal-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    setEnviado(false)
                    setApiStatus('idle')
                    setApiMessage('')
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </main>
  )
}

export default App
