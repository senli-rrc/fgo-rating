import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { Servant, User } from './types';
import { dbService } from './services/dbService';
import { fetchAtlasData } from './services/atlasService';
import { supabase } from './lib/supabase';

// Import Pages
import HomePage from './pages/HomePage';
import ServantDetailPage from './pages/ServantDetailPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RankingPage from './pages/RankingPage';
import MainQuestsPage from './pages/MainQuestsPage';
import ReviewsPage from './pages/ReviewsPage';

const App: React.FC = () => {
  const [servants, setServants] = useState<Servant[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [region, setRegion] = useState<string>('JP');
  const [editingServant, setEditingServant] = useState<Servant | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!error && userProfile) {
          setUser({
            id: 1,
            username: userProfile.username,
            email: userProfile.email,
            role: userProfile.role,
            status: userProfile.status,
            createdAt: new Date(userProfile.created_at).getTime()
          });
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      await dbService.init();
      await loadServants();
    }
  };

  const loadServants = async () => {
    if (servants.length === 0) setLoading(true);

    const data = await dbService.getAllServants();
    const allRatings = await dbService.getAllRatings();

    const ratingMap = new Map<number, { sum: number; count: number }>();
    allRatings.forEach(r => {
      if (!ratingMap.has(r.servantId)) {
        ratingMap.set(r.servantId, { sum: 0, count: 0 });
      }
      const entry = ratingMap.get(r.servantId)!;
      entry.sum += r.score;
      entry.count += 1;
    });

    const servantsWithScores = data.map(s => {
      const entry = ratingMap.get(s.id);
      return {
        ...s,
        averageScore: entry ? parseFloat((entry.sum / entry.count).toFixed(1)) : undefined
      };
    });

    servantsWithScores.sort((a, b) => b.collectionNo - a.collectionNo);
    setServants(servantsWithScores);
    setLoading(false);
  };

  const handleLogin = async (username: string, password?: string) => {
    const validUser = await dbService.authenticateUser(username, password || '');
    if (validUser) {
      setUser(validUser);
      return true;
    } else {
      throw new Error('Invalid username or password.');
    }
  };

  const handleRegister = async (email: string, username: string, password: string) => {
    try {
      const mockIp = `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
      const newUser = await dbService.registerUser(email, username, password, mockIp);
      setUser(newUser);
      alert(`Welcome to Chaldea, Master ${newUser.username}!`);
      return true;
    } catch (e: any) {
      throw new Error(e.message || 'Registration failed');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setEditingServant(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSaveServant = async (updatedServant: Servant) => {
    await dbService.saveServant(updatedServant);
    await loadServants();
    setEditingServant(null);
    alert('Servant saved successfully!');
  };

  const handleDeleteServant = async (id: number) => {
    await dbService.deleteServant(id);
    await loadServants();
    setEditingServant(null);
  };

  const handleQuickImport = async () => {
    if (importing) return;
    setImporting(true);
    try {
      const newData = await fetchAtlasData(region, (msg) => console.log(msg));
      await dbService.bulkUpsert(newData);
      await loadServants();
    } catch (e) {
      console.error(e);
      alert('Failed to import data. Check console.');
    } finally {
      setImporting(false);
    }
  };

  const handleRegionChange = async (newRegion: string) => {
    if (newRegion === region) return;
    setRegion(newRegion);
    setImporting(true);
    try {
      const newData = await fetchAtlasData(newRegion, (msg) => console.log(msg));
      await dbService.bulkUpsert(newData);
      await loadServants();
    } catch (e) {
      console.error(e);
      alert(`Failed to switch to ${newRegion} server data.`);
    } finally {
      setImporting(false);
    }
  };

  if (loading && servants.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Navbar user={user} onLogout={handleLogout} />

        <main className="container mx-auto pb-12">
          <Routes>
            <Route path="/" element={<Navigate to="/servants" replace />} />

            <Route path="/servants" element={
              <HomePage
                servants={servants}
                loading={loading}
                importing={importing}
                region={region}
                onQuickImport={handleQuickImport}
                onRegionChange={handleRegionChange}
              />
            } />

            <Route path="/servant/:id" element={
              <ServantDetailPage
                servants={servants}
                user={user}
                isAdmin={user?.role === 'ADMIN'}
                onEdit={(servant) => {
                  // Navigate to admin page - in the old version this would set editingServant
                  // For now, we can just console log or skip this feature
                  console.log('Edit servant:', servant);
                }}
              />
            } />

            <Route path="/servant/:id/reviews" element={
              <ReviewsPage servants={servants} user={user} />
            } />

            <Route path="/rankings" element={
              <RankingPage servants={servants} />
            } />

            <Route path="/mainquests" element={
              <MainQuestsPage region={region} />
            } />

            <Route path="/admin" element={
              user?.role === 'ADMIN' ? (
                <AdminPage
                  servants={servants}
                  onSave={handleSaveServant}
                  onDelete={handleDeleteServant}
                  editingServant={editingServant}
                  onCancelEdit={() => setEditingServant(null)}
                  onDataSync={loadServants}
                  region={region}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            } />

            <Route path="/login" element={
              user ? <Navigate to="/servants" replace /> : <LoginPage onLogin={handleLogin} />
            } />

            <Route path="/register" element={
              user ? <Navigate to="/servants" replace /> : <RegisterPage onRegister={handleRegister} />
            } />

            <Route path="*" element={
              <div className="p-8 text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">404 - Page Not Found</h1>
                <p className="text-gray-600">The page you're looking for doesn't exist.</p>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
