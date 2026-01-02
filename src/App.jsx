import { useProgress } from './hooks/useProgress';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';

function App() {
  const { startDate, completions, startChallenge, toggleCompletion, getDayNumber, getTotalPushups, isSetup, userStartDate } = useProgress();

  return (
    <>
      {!isSetup ? (
        <Onboarding onStart={startChallenge} />
      ) : (
        <Dashboard
          getDayNumber={getDayNumber}
          getTotalPushups={getTotalPushups}
          toggleCompletion={toggleCompletion}
          startDate={startDate} // Math anchor (Jan 1)
          userStartDate={userStartDate} // Interaction anchor (User Choice)
          completions={completions}
        />
      )}
    </>
  );
}

export default App;
