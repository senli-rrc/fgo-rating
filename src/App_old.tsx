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
  // Application State
  const [servants, setServants] = useState<Servant[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [region, setRegion] = useState<string>('JP'); // 'JP', 'CN', 'EN'

  const [editingServant, setEditingServant] = useState<Servant | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Fetch user profile from database
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!error && userProfile) {
          setUser({
            id: 1, // Placeholder for compatibility
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
      // Initialize DB and load servants
      await dbService.init();
      await loadServants();
    }
  };

  const loadServants = async () => {
    // Only show full loading spinner if we have no data yet
    if (servants.length === 0) setLoading(true);

    const data = await dbService.getAllServants();
    const allRatings = await dbService.getAllRatings();

    // Calculate Average Scores
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

    // Default sort: Descending by Collection No (ID)
    servantsWithScores.sort((a, b) => b.collectionNo - a.collectionNo);
    setServants(servantsWithScores);
    setLoading(false);
  };

  // Handlers
  const handleLogin = async (username: string, password?: string) => {
    // Legacy support for plain "admin/admin" bypass or if password is sent from new Login
    const validUser = await dbService.authenticateUser(username, password || '');

    if (validUser) {
        setUser(validUser);
        setCurrentView(ViewState.HOME);
    } else {
        throw new Error('Invalid username or password.');
    }
  };

  const handleRegister = async (email: string, username: string, password: string) => {
     try {
         // Mock IP Generation
         const mockIp = `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
         const newUser = await dbService.registerUser(email, username, password, mockIp);
         setUser(newUser);
         setCurrentView(ViewState.HOME);
         alert(`Welcome to Chaldea, Master ${newUser.username}!`);
     } catch (e: any) {
         throw new Error(e.message || 'Registration failed');
     }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setCurrentView(ViewState.HOME);
      setEditingServant(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleServantClick = (servant: Servant) => {
    setSelectedServant(servant);
    setCurrentView(ViewState.DETAIL);
    window.scrollTo(0, 0);
  };

  const handleSaveServant = async (updatedServant: Servant) => {
    await dbService.saveServant(updatedServant);
    await loadServants(); // Refresh list
    setEditingServant(null);

    if (currentView === ViewState.DETAIL && selectedServant?.id === updatedServant.id) {
        setSelectedServant(updatedServant);
    }
    alert('Servant saved successfully!');
  };

  const handleDeleteServant = async (id: number) => {
      await dbService.deleteServant(id);
      await loadServants();
      setEditingServant(null);
      if(currentView === ViewState.DETAIL) {
          setCurrentView(ViewState.HOME);
      }
  }

  const handleEditClick = (servant: Servant) => {
      setEditingServant(servant);
      setCurrentView(ViewState.ADMIN);
  }

  // Force refresh when Admin bulk import happens
  const handleAdminDataChange = async () => {
    await loadServants();
    setCurrentView(ViewState.HOME);
  }

  const handleQuickImport = async () => {
    if (importing) return;
    setImporting(true);
    try {
        const newData = await fetchAtlasData(region, (msg) => console.log(msg));
        await dbService.bulkUpsert(newData);
        await loadServants();
    } catch (e) {
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
        // Fetch new data for the region and update DB
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

  // View Routing Logic
  const renderContent = () => {
    if (loading && servants.length === 0) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    switch (currentView) {
      case ViewState.HOME:
        return (
          <HomePage
            servants={servants}
            loading={loading}
            importing={importing}
            region={region}
            onSelectServant={handleServantClick}
            onQuickImport={handleQuickImport}
            onRegionChange={handleRegionChange}
          />
        );

      case ViewState.DETAIL:
        if (!selectedServant) return null;

        // Find prev/next for navigation
        const currentIndex = servants.findIndex(s => s.id === selectedServant.id);
        const prevServant = currentIndex > 0 ? servants[currentIndex - 1] : undefined;
        const nextServant = currentIndex < servants.length - 1 ? servants[currentIndex + 1] : undefined;

        return (
          <ServantDetailPage
            servant={selectedServant}
            onBack={() => setCurrentView(ViewState.HOME)}
            isAdmin={user?.role === 'ADMIN'}
            onEdit={handleEditClick}
            prevServant={prevServant}
            nextServant={nextServant}
            onSelectServant={handleServantClick}
            user={user}
            onNavigateToLogin={() => setCurrentView(ViewState.LOGIN)}
            onViewReviews={() => setCurrentView(ViewState.REVIEWS)}
          />
        );

      case ViewState.REVIEWS:
        if (!selectedServant) return null;
        return (
            <ReviewsPage
                servant={selectedServant}
                user={user}
                onBack={() => setCurrentView(ViewState.DETAIL)}
                onNavigateToLogin={() => setCurrentView(ViewState.LOGIN)}
            />
        );

      case ViewState.ADMIN:
        if (user?.role !== 'ADMIN') {
            return <div className="p-8 text-center text-red-600">Access Denied</div>;
        }
        return (
          <AdminPage
            servants={servants}
            onSave={handleSaveServant}
            onDelete={handleDeleteServant}
            editingServant={editingServant}
            onCancelEdit={() => {
                setEditingServant(null);
                setCurrentView(ViewState.HOME);
            }}
            onDataSync={handleAdminDataChange}
            region={region}
          />
        );

      case ViewState.LOGIN:
        return (
          <LoginPage
            onLogin={handleLogin}
            onCancel={() => setCurrentView(ViewState.HOME)}
            onNavigateToRegister={() => setCurrentView(ViewState.REGISTER)}
          />
        );

      case ViewState.REGISTER:
        return (
          <RegisterPage
            onRegister={handleRegister}
            onCancel={() => setCurrentView(ViewState.HOME)}
            onNavigateToLogin={() => setCurrentView(ViewState.LOGIN)}
          />
        );

      case ViewState.RANKING:
        return (
            <RankingPage
                servants={servants}
                onNavigateToReviews={(servant) => {
                    setSelectedServant(servant);
                    setCurrentView(ViewState.REVIEWS);
                    window.scrollTo(0,0);
                }}
            />
        );

      case ViewState.MAIN_QUESTS:
        return (
            <MainQuestsPage region={region} />
        );

      default:
        return <div>View Not Found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Navbar
        user={user}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        currentView={currentView}
      />

      <main className="container mx-auto pb-12">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;