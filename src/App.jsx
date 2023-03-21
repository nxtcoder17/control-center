import { createEffect, createSignal, createResource } from "solid-js";

function App() {
  // const [tabs, setTabs] = createSignal(window.tabs)
  // const [url, setUrl] = createSignal('http://localhost:3000/index.html')
  const [data, { mutate, refetch }] = createResource(async () => {
    console.log("hi")
    const tabs = await chrome.tabs.query({})
    console.log("[tabs]: ", tabs)
    return tabs
  });

  createEffect(() => {
    console.log("these are tabs: ", data())
  })

  return (
    <div>
      <p class="text-4xl text-green-700 text-center py-20">Hello world!</p>
      <p class="text-4xl text-green-700 text-center py-20">hello {data()}</p>
      {/* <p class="text-4xl text-green-700 text-center py-20">{url()}</p> */}
      {/* <div>{JSON.stringify(data(), null, 2)}</div> */}
    </div>
  );
}

export default App;
