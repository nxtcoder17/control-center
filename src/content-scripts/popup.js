console.log("hello world")

let input = document.querySelector("input");

input.addEventListener("change", (e) => {
  setValue(e.target.value)
})

async function setValue(v) {
  await browser.storage.local.set({ value })
}

async function init() {
  let { value } = browser.local.storage.get('value');
  if (!value) {
    value = 0;
  }
  input.value = value;
  setValue(value)
}

init().catch(e => console.error(e))


