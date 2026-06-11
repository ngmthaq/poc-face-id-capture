import FaceRegister from "./templates/FaceRegister";

export default function App() {
  return (
    <FaceRegister
      onComplete={(captures) => console.log("Captures:", captures)}
      onExit={() => {}}
      locale="en"
    />
  );
}
