import FaceRegister from "./templates/FaceRegister";

export default function App() {
  return (
    <FaceRegister
      showIntroScreen
      showResultScreen
      locale="en"
      onComplete={(captures) => console.log("Captures:", captures)}
      onExit={() => console.log("Exited")}
    />
  );
}
