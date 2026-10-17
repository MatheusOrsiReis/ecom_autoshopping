# AutoShopping

O AutoShopping é um projeto acadêmico de comércio de veículos. O sistema permite que clientes consultem o catálogo, criem uma conta, montem o carrinho e façam pedidos. O administrador pode cadastrar veículos e categorias, controlar estoque, acompanhar pedidos e entregas e visualizar relatórios.

## Tecnologias usadas

- Frontend: HTML, CSS e JavaScript
- Backend: Node.js e Express
- Banco de dados: MySQL com Sequelize
- Autenticação: JWT e bcrypt
- Gráficos: Chart.js

## Estrutura do projeto

- `frontend`: páginas, estilos, scripts e imagens do site
- `backend`: servidor, controllers, models e conexão com o banco
- `diagramas_UML`: diagramas do sistema e modelo do banco
- `Documentacao`: documentos de requisitos e infraestrutura

## Como executar

É necessário ter o Node.js, o npm e o MySQL instalados. Antes de iniciar, crie o arquivo `backend/.env` usando `backend/var_ambiente_env_exemplo.txt` como exemplo e coloque nele os dados do seu MySQL.

Abra um terminal na pasta do projeto e execute:

```bash
cd backend
npm install
node conn.js
node sync.js
node index.js
```

Os comandos criam o banco `db_ecom`, geram as sete tabelas e iniciam o servidor em `http://localhost:3000`.

Para abrir o site, execute o arquivo `frontend/index.html` com a extensão Live Server do VS Code. As rotas da API também podem ser testadas pelo arquivo `backend/rest_client.http` usando a extensão REST Client.

## Perfis do sistema

- Cliente: consulta veículos, usa o carrinho, finaliza pedidos e acompanha suas compras.
- Administrador: gerencia categorias, veículos, estoque, pedidos, entregas, usuários e relatórios.

Desenvolvido por Matheus Orsi Reis.
