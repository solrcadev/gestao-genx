
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import Profile from './pages/Profile';
import Athletes from './pages/Athletes';
import CreateAthlete from './pages/CreateAthlete';
import EditAthlete from './pages/EditAthlete';
import Trainings from './pages/Trainings';
import CreateTraining from './pages/CreateTraining';
import EditTraining from './pages/EditTraining';
import Exercises from './pages/Exercises';
import CreateExercise from './pages/CreateExercise';
import EditExercise from './pages/EditExercise';
import TreinoDosDia from './pages/TreinoDosDia';
import BottomNavbar from './components/BottomNavbar';
import { Toaster } from '@/components/ui/toaster';
import Performance from './pages/Performance';
import TrainingReports from './pages/TrainingReports';
import Settings from './pages/Settings';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/athletes" element={<PrivateRoute><Athletes /></PrivateRoute>} />
          <Route path="/athletes/create" element={<PrivateRoute><CreateAthlete /></PrivateRoute>} />
          <Route path="/athletes/edit/:id" element={<PrivateRoute><EditAthlete /></PrivateRoute>} />
          <Route path="/trainings" element={<PrivateRoute><Trainings /></PrivateRoute>} />
          <Route path="/trainings/create" element={<PrivateRoute><CreateTraining /></PrivateRoute>} />
          <Route path="/trainings/edit/:id" element={<PrivateRoute><EditTraining /></PrivateRoute>} />
          <Route path="/exercises" element={<PrivateRoute><Exercises /></PrivateRoute>} />
          <Route path="/exercises/create" element={<PrivateRoute><CreateExercise /></PrivateRoute>} />
          <Route path="/exercises/edit/:id" element={<PrivateRoute><EditExercise /></PrivateRoute>} />
          <Route path="/treino-do-dia" element={<PrivateRoute><TreinoDosDia /></PrivateRoute>} />
          <Route path="/performance/:athleteId" element={<PrivateRoute><Performance /></PrivateRoute>} />
          <Route path="/training-reports" element={<PrivateRoute><TrainingReports /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        </Routes>
      </main>
      <BottomNavbar />
      <Toaster />
    </div>
  );
}

export default App;
