function MyButton({ title }: { title: string }) {
  return (
    <button>{title}</button>
  );
}

export default function MyApp() {
  return (
    <div>
      <h1>Dashboard</h1>
      <MyButton title="I'm a button" />
    </div>
  );
}
