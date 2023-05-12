export const Page = {};

Page.Root = (props) => {
  return <div class={`h-full min-h-screen w-screen truncate overflow-x-hidden flex flex-col ${props.class}`}
    classList={{ "border-8 border-green-800": props.debug }}
  >
    {props.children}
  </div>;
};

Page.RootExample = () => {
  return <Page.Root>
    <span>hi jasdfkjdkfjaklfjklajsdASsajdlksdajkldsjaklajdsfkljsdksadkasdklfjsdkaljsdklafjskdaljsadlkfjsakldjfklsdjfklsdjfklsdajfklasjfklsadjfklsadjfklasdjfklsadjklsadjklsdjfklsdajfklsdajfklsdajfklsadjfklsdajklsdajlsdajkflsdahfuasdfuasdf</span>
  </Page.Root>
};
