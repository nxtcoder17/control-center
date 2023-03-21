document.body.style.border = "20px solid cyan";
console.log("hi hello")
//
// let style = document.createElement("style")
// document.body.appendChild(style)
//
// browser.storage.onChanged.addListener((changes, area) => {
//   if (area == "local" && 'value' in changes) {
//     update(changes.value.newValue)
//   }
// })
//
// function update(value) {
//   style.innerText = `html { filter: sepia(${value}%) !important}`;
// }
//
// browser.storage.local.get("value").then(result => update(result.value))
// import { render } from 'solid-js/web';
//
// import './index.css';
// import App from './App';
//
// const root = document.getElementById('root');
//
// if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
//   throw new Error(
//     'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got mispelled?',
//   );
// }
//
// console.log("Here")
// render(() => <App />, root);
