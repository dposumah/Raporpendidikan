'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

const SiswaDataContext = createContext();

export function SiswaDataProvider({ children }) {
  const [allData, setAllData] = useState([]);
  const [periodeOptions, setPeriodeOptions] = useState([]);
  const [selectedPeriode, setSelectedPeriode] = useState('');
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  // Fetch Periode Options initially
  useEffect(() => {
    fetch('/api/periode')
      .then(res => res.json())
      .then(data => {
        setPeriodeOptions(data);
        if (data && data.length > 0) {
          setSelectedPeriode(data[0]);
        }
      })
      .catch(err => {
        console.error('Error fetching periode options', err);
        setLoading(false);
      });
  }, []);

  // Fetch Data whenever selectedPeriode changes
  useEffect(() => {
    if (selectedPeriode) {
      fetchData(selectedPeriode);
    }
  }, [selectedPeriode]);

  const fetchData = async (periode) => {
    setLoading(true);
    let allResult = [];
    let from = 0;
    const limit = 1000;
    let hasMore = true;

    try {
      while (hasMore) {
        let query = supabase.from('siswa').select('*').eq('periode', periode).range(from, from + limit - 1);
        const { data: result, error } = await query;
        
        if (error) {
          console.error('Error fetching data:', error);
          hasMore = false;
        } else {
          if (result && result.length > 0) {
            allResult = [...allResult, ...result];
            from += limit;
            if (result.length < limit) hasMore = false;
          } else {
            hasMore = false;
          }
        }
      }
      setAllData(allResult);
    } catch (err) {
      console.error('Error in fetching data chunk:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiswaDataContext.Provider value={{
      allData,
      periodeOptions,
      selectedPeriode,
      setSelectedPeriode,
      loading
    }}>
      {children}
    </SiswaDataContext.Provider>
  );
}

export function useSiswaData() {
  const context = useContext(SiswaDataContext);
  if (!context) {
    throw new Error('useSiswaData must be used within a SiswaDataProvider');
  }
  return context;
}
