// const input = document.querySelector("input");

// input.addEventListener("change", async (e) => {
//   const file = e.target.files[0];
//   //   console.log(e.target.files[0]);
//   //   const response = await fetch("http://192.168.0.104:3000", {
//   //     method: "POST",
//   //     body: file,
//   //     headers: {
//   //       filename: file.name,
//   //     },
//   //   });
//   //   const data = await response.json();
//   //   console.log(data);
//   const xhr = new XMLHttpRequest();
//   xhr.open("POST", "http://192.168.0.104:3000", true);
//   xhr.setRequestHeader("filename", file.name);
//   xhr.addEventListener("load", (e) => {
//     console.log("load");
//     console.log(e);
//     console.log(xhr.response);
//   });
//   xhr.upload.addEventListener("progress", (e) => {
//     console.log("progress");
//     const progress = (e.loaded / e.total) * 100;
//     console.log(`${progress.toFixed(2)}% Uploaded`);
//   });
//   xhr.send(file);
// });

const response = await fetch("http://localhost:4000/", {
  credentials: "include",
});
const data = await response.json();
console.log(data);
