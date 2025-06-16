use("todo_db");
// db.createCollection("todo");
db.todo.insertOne({
  title: "Buy groceries",
  description: "Buy groceries from the store",
  completed: false,
});
