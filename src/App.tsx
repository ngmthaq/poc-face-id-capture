import FaceRegister from "./templates/FaceRegister";

export default function App() {
  return (
    <FaceRegister
      locale="en"
      showResultScreen
      onComplete={(captures) => console.log("Captures:", captures)}
      onExit={() => {}}
    />
  );
}
