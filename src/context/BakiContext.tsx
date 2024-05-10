import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import { useAuthContext } from "./AuthContext";

export type Baki = Database['public']['Tables']['bakis']['Row'];
export type Bakis = { bakis: Baki[] };
export type BakiInsert = Database['public']['Tables']['bakis']['Insert'];

interface BakiContextProps {
  bakis: Baki[];
  addBaki: (baki: BakiInsert) => Promise<Baki | undefined>;
  deleteBaki: (baki: Baki) => void;
  updateBaki: (baki: Baki) => void;
  loading: boolean;
  currentUserBaki: Baki[];
}

const BakiContext = createContext<BakiContextProps>(undefined!);

export function BakiProvider({ children }: PropsWithChildren) {
  const [bakis, setBakis] = useState<Baki[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();
  const { user } = useAuthContext();
  const [currentUserBaki, setCurrentUserBaki] = useState<Baki[]>([]);
  

  useEffect(() => {
    const fetchBakis = async () => {
      const { data: bakis, error } = await supabase
        .from('bakis')
        .select('*');

      if (error) {
        console.error('Error fetching bakis:', error);
        showAlert('Error fetching bakis', 'error');
      }

      setBakis(bakis || []);
      setCurrentUserBaki(bakis?.filter(baki => baki.user_id === user?.id) || []);
      setLoading(false);
    };

    fetchBakis();

    const handleChanges = (payload: any) => {
      if (payload.eventType === 'INSERT') {
        setBakis(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setBakis(prev => prev.map(baki => baki.id === payload.new.id ? payload.new : baki));
      } else if (payload.eventType === 'DELETE') {
        setBakis(prev => prev.filter(baki => baki.id !== payload.old.id));
      }
    };

    const subscription = supabase
      .channel('bakis')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bakis' }, payload => {
        handleChanges(payload);
      })
      .subscribe();

    setLoading(false);

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert, user?.id]);

  const addBaki = async (baki: BakiInsert) => {
    const { data, error } = await supabase
      .from('bakis')
      .insert([baki]);

    if (error) {
      console.error('Error adding baki:', error);
      showAlert('Error adding baki', 'error');
    }

    return data?.[0];
  };

  const deleteBaki = async (baki: Baki) => {
    const { error } = await supabase
      .from('bakis')
      .delete()
      .eq('id', baki.id);

    if (error) {
      console.error('Error deleting baki:', error);
      showAlert('Error deleting baki', 'error');
    }
  };

  const updateBaki = async (baki: Baki) => {
    const { error } = await supabase
      .from('bakis')
      .update(baki)
      .eq('id', baki.id);

    if (error) {
      console.error('Error updating baki:', error);
      showAlert('Error updating baki', 'error');
    }
  }

  return (
    <BakiContext.Provider value={{ bakis, addBaki, deleteBaki, updateBaki, loading, currentUserBaki }}>
      {children}
    </BakiContext.Provider>
  );
}

export function useBakiContext() {
  const context = useContext(BakiContext);

  if (!context) {
    throw new Error('useBakiContext must be used within a BakiProvider');
  }

  return context;
}

