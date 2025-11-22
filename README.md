# 🐾 Cuxinho - Sistema de Controle Veterinário

Sistema completo de gestão veterinária para controle de pets, vacinações e usuários, desenvolvido com Flask e interface web moderna.

## 📋 Funcionalidades

### 🔐 Sistema de Autenticação
- Login seguro com sessões
- Alteração de senhas
- Controle de acesso por perfis (Administrador e Usuário)
- Logout seguro

### 👥 Gestão de Usuários
- **Administradores**: Acesso completo ao sistema
- **Usuários**: Permissões configuráveis para:
  - Gestão de pets
  - Controle de vacinação
  - Acesso a relatórios
- CRUD completo de usuários (apenas para administradores)

### 🐕 Gestão de Pets
- Cadastro completo de pets (cães e gatos)
- Informações do proprietário
- Dados do animal (nome, espécie, raça, peso, etc.)
- Edição e exclusão de registros

### 💉 Controle de Vacinação
- Registro detalhado de vacinações
- Baseado no modelo de cartão de vacina para pets
- Tipos de vacinas suportadas:
  - **Cães**: V8, V10, Gripe Canina, Giárdia, Raiva
  - **Gatos**: V4, V5, FELV
- Controle de doses (1ª, 2ª, 3ª dose, reforço anual)
- Agendamento de próximas doses
- Histórico completo por pet

### 🗂️ Controle Parasitário
- Registro de vermífugos e antiparasitários
- Controle de datas e dosagens
- Histórico por pet

### 📊 Dashboard e Relatórios
- Estatísticas gerais do sistema
- Cronograma de vacinações (próximos 30 dias)
- Relatórios para administradores

## 🛠️ Tecnologias Utilizadas

### Backend
- **Flask** - Framework web Python
- **SQLAlchemy** - ORM para banco de dados
- **SQLite** - Banco de dados
- **Werkzeug** - Segurança e hash de senhas
- **Flask-CORS** - Controle de CORS

### Frontend
- **HTML5** - Estrutura
- **CSS3** - Estilização moderna com gradientes e animações
- **JavaScript** - Interatividade e comunicação com API
- **Design Responsivo** - Compatível com dispositivos móveis

## 🚀 Instalação e Execução

### Pré-requisitos
- Python 3.11+
- pip

### Passos para instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd cuxinho
```

2. **Crie e ative o ambiente virtual**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

3. **Instale as dependências**
```bash
pip install -r requirements.txt
```

4. **Execute a aplicação**
```bash
python src/main.py
```

5. **Acesse o sistema**
- URL: http://localhost:5000
- Usuário padrão: `admin`
- Senha padrão: `admin123`

## 📁 Estrutura do Projeto

```
cuxinho/
├── src/
│   ├── models/          # Modelos do banco de dados
│   │   ├── user.py      # Modelo de usuários
│   │   └── pet.py       # Modelos de pets, vacinações e controle parasitário
│   ├── routes/          # Rotas da API
│   │   ├── auth.py      # Autenticação
│   │   ├── user.py      # Gestão de usuários
│   │   └── pet.py       # Gestão de pets e vacinações
│   ├── static/          # Arquivos estáticos
│   │   ├── index.html   # Interface principal
│   │   └── app.js       # JavaScript da aplicação
│   ├── database/        # Banco de dados SQLite
│   └── main.py          # Arquivo principal
├── venv/                # Ambiente virtual
├── requirements.txt     # Dependências
└── README.md           # Documentação
```

## 🔧 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Dados do usuário atual
- `POST /api/auth/change-password` - Alterar senha
- `GET /api/auth/check-session` - Verificar sessão

### Usuários (Admin apenas)
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `GET /api/users/{id}` - Obter usuário
- `PUT /api/users/{id}` - Atualizar usuário
- `DELETE /api/users/{id}` - Excluir usuário
- `PUT /api/users/{id}/permissions` - Atualizar permissões

### Pets
- `GET /api/pets` - Listar pets
- `POST /api/pets` - Criar pet
- `GET /api/pets/{id}` - Obter pet
- `PUT /api/pets/{id}` - Atualizar pet
- `DELETE /api/pets/{id}` - Excluir pet

### Vacinações
- `GET /api/pets/{id}/vaccinations` - Listar vacinações do pet
- `POST /api/pets/{id}/vaccinations` - Criar vacinação
- `PUT /api/vaccinations/{id}` - Atualizar vacinação
- `DELETE /api/vaccinations/{id}` - Excluir vacinação

### Controle Parasitário
- `GET /api/pets/{id}/parasitic-controls` - Listar controles do pet
- `POST /api/pets/{id}/parasitic-controls` - Criar controle
- `PUT /api/parasitic-controls/{id}` - Atualizar controle
- `DELETE /api/parasitic-controls/{id}` - Excluir controle

### Relatórios
- `GET /api/reports/vaccination-schedule` - Cronograma de vacinações

## 🎨 Interface

### Características do Design
- **Design Moderno**: Gradientes, sombras e animações suaves
- **Responsivo**: Adaptável a diferentes tamanhos de tela
- **Intuitivo**: Navegação por abas e modais
- **Acessível**: Cores contrastantes e elementos bem definidos

### Funcionalidades da Interface
- Dashboard com estatísticas em tempo real
- Formulários modais para cadastros
- Tabelas interativas com ações
- Sistema de alertas e notificações
- Navegação por abas
- Controle de permissões visual

## 🔒 Segurança

- Senhas criptografadas com Werkzeug
- Controle de sessões seguras
- Validação de permissões em todas as rotas
- Proteção contra acesso não autorizado
- Validação de dados de entrada

## 📝 Modelo de Dados

### Usuários
- ID, username, email, senha (hash)
- Perfil (admin/user)
- Status ativo/inativo
- Permissões específicas
- Timestamps de criação e último login

### Pets
- Dados básicos (nome, espécie, raça, sexo, peso)
- Data de nascimento
- Informações do proprietário
- Status ativo/inativo

### Vacinações
- Referência ao pet
- Nome e tipo da vacina
- Número da dose
- Datas de aplicação e próxima dose
- Veterinário responsável
- Lote da vacina
- Peso no momento da vacinação
- Observações

### Controle Parasitário
- Referência ao pet
- Nome e tipo do produto
- Datas de aplicação e próxima aplicação
- Dose aplicada
- Peso no momento da aplicação
- Veterinário responsável
- Observações

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👨‍💻 Autor

Desenvolvido em homenagem ao filha de minha Alma, para facilitar o controle veterinário de pets.

---

**Cuxinho** - Sistema completo de controle veterinário 🐾
