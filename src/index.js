const { response } = require("express");
const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

//Middleware
function verifyIfExistsAccountCpf(req, res, next) {
  const { cpf } = req.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return res.status(400).json({ error: "Customer not found" });
  }

  req.customer = customer;

  return next();
}

// That function return the balance of accounts
function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

// POST - Create account
app.post("/account", (req, res) => {
  const { cpf, name } = req.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return res.status(400).json({ error: "Customer already exists!" });
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  return res.status(201).send();
});

// app.use(verifyIfExistsAccountCpf);  - TODAS AS ROTAS ABAIXO DELE USAM O MIDDLEWARE

// GET - Check statement account
app.get("/statement", verifyIfExistsAccountCpf, (req, res) => {
  const { customer } = req;

  return res.json(customer.statement);
});

// POST - Create deposit
app.post("/deposit", verifyIfExistsAccountCpf, (req, res) => {
  const { description, amount } = req.body;

  const { customer } = req;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

// POST - Create withdraw
app.post("/withdraw", verifyIfExistsAccountCpf, (req, res) => {
  const { amount } = req.body;
  const { customer } = req;

  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return res.status(400).json({ error: "Insufficient funds!" });
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit",
  };

  customer.statement.push(statementOperation);

  return res.status(201).send();
});

// GET - Check statement account by Date
app.get("/statement/date", verifyIfExistsAccountCpf, (req, res) => {
  const { customer } = req;
  const { date } = req.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  return res.json(statement);
});

// PUT - Update name account
app.put("/account", verifyIfExistsAccountCpf, (req, res) => {
  const { name } = req.body;
  const { customer } = req;

  customer.name = name;

  return res.status(201).send();
});

// GET - Check specified account
app.get("/account", verifyIfExistsAccountCpf, (req, res) => {
  const { customer } = req;

  return res.json(customer);
});

// DELETE - Delete specified account
app.delete("/account", verifyIfExistsAccountCpf, (req, res) => {
  const { customer } = req;

  // splice
  customers.splice(customer, 1);

  return res.status(200).json(customers);
});

// GET - Check balance of specified account
app.get("/balance", verifyIfExistsAccountCpf, (req, res) => {
  const { customer } = req;

  const balance = getBalance(customer.statement);

  return res.json(balance);
});

// GET - Check all accounts created
app.get("/accounts", (req, res) => {
  const { customer } = req;

  return res.status(200).json(customers);
});

app.listen(3333);
