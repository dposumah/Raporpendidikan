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
    try {
      // 1. Get total count
      const { count, error } = await supabase
        .from('siswa')
        .select('*', { count: 'exact', head: true })
        .eq('periode', periode);
      
      if (error) {
        console.error('Error fetching count:', error);
        setAllData([]);
        return;
      }
      if (!count) {
        setAllData([]);
        return;
      }

      // 2. Prepare parallel requests
      const limit = 1000;
      const totalPages = Math.ceil(count / limit);
      const promises = [];

      for (let i = 0; i < totalPages; i++) {
        const from = i * limit;
        const to = from + limit - 1;
        promises.push(
          supabase
            .from('siswa')
            .select('*')
            .eq('periode', periode)
            .range(from, to)
        );
      }

      // 3. Execute in batches of 5 to avoid rate limits while remaining fast
      let allResult = [];
      const batchSize = 5;
      for (let i = 0; i < promises.length; i += batchSize) {
        const batch = promises.slice(i, i + batchSize);
        const results = await Promise.all(batch);
        results.forEach((res) => {
          if (res.data) {
            allResult = [...allResult, ...res.data];
          }
        });
      }
      
      setAllData(allResult);
    } catch (err) {
      console.error('Error in fetching data:', err);
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
