import React, { createContext, useContext, useState, useEffect } from 'react';
import { TableTennisDictionary, MatchData } from '../types';
import { fetchDictionary, fetchMatchData, saveMatchDataToGitHub, getGitHubConfig } from '../data/github';
import { MOCK_DICTIONARY, MOCK_MATCHES } from '../data/mock';

interface AppContextType {
  dictionary: TableTennisDictionary | null;
  matchData: MatchData[];
  dataSha: string;
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  dataMode: 'github' | 'mock';
  refreshData: () => Promise<void>;
  saveData: (newData: MatchData[]) => Promise<void>;
  checkConfig: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dictionary, setDictionary] = useState<TableTennisDictionary | null>(null);
  const [matchData, setMatchData] = useState<MatchData[]>([]);
  const [dataSha, setDataSha] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataMode, setDataMode] = useState<'github' | 'mock'>('mock');

  const checkConfig = () => {
    const config = getGitHubConfig();
    setIsConfigured(!!(config.owner && config.repo && config.token));
  };

  const refreshData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!isConfigured) {
        throw new Error("GitHub not configured");
      }
      const dict = await fetchDictionary();
      setDictionary(dict);
      const res = await fetchMatchData();
      setMatchData(res.data);
      setDataSha(res.sha);
      setDataMode('github');
    } catch (err: any) {
      console.warn("Falling back to Mock Data:", err.message);
      setDictionary(MOCK_DICTIONARY);
      setMatchData(MOCK_MATCHES);
      setDataMode('mock');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConfig();
  }, []);

  useEffect(() => {
    refreshData();
  }, [isConfigured]);

  const saveData = async (newData: MatchData[]) => {
    try {
      if (dataMode === 'github') {
        const newSha = await saveMatchDataToGitHub(newData, dataSha);
        setDataSha(newSha);
      }
      setMatchData(newData);
    } catch (err: any) {
      throw new Error(err.message || 'Lỗi khi lưu dữ liệu');
    }
  };

  return (
    <AppContext.Provider value={{ dictionary, matchData, dataSha, isConfigured, isLoading, error, dataMode, refreshData, saveData, checkConfig }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

