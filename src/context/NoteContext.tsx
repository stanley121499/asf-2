import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import { useAccountBalanceContext, AccountBalanceInsert } from "./AccountBalanceContext";
import { useUserContext } from "./UserContext";
import { useTransactionContext, TransactionInsert } from "./TransactionContext";
import { useBakiContext, BakiInsert } from "./BakiContext";

export type Note = Database['public']['Tables']['notes']['Row'];
export type Notes = { notes: Note[] };
export type NoteInsert = Database['public']['Tables']['notes']['Insert'];

interface NoteContextProps {
  notes: Note[];
  addNote: (note: NoteInsert) => void;
  deleteNote: (note: Note) => void;
  updateNote: (note: Note) => void;
  approveNote: (note: Note) => void;
  rejectNote: (note: Note) => void;
  loading: boolean;
}

const NoteContext = createContext<NoteContextProps>(undefined!);

export function NoteProvider({ children }: PropsWithChildren) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();
  const { accountBalances, addAccountBalance } = useAccountBalanceContext();
  const { users } = useUserContext();
  const { addTransaction } = useTransactionContext();
  const { bakis, addBaki } = useBakiContext();

  useEffect(() => {
    const fetchNotes = async () => {
      const { data: notes, error } = await supabase
        .from('notes')
        .select('*')
        .order('id' , { ascending: false });

      if (error) {
        console.error('Error fetching notes:', error);
        showAlert('Error fetching notes', 'error');
      }

      setNotes(notes || []);
      setLoading(false);
    };

    fetchNotes();

    const handleChanges = (payload: any) => {
      if (payload.eventType === 'INSERT') {
        setNotes(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setNotes(prev => prev.map(note => note.id === payload.new.id ? payload.new : note));
      } else if (payload.eventType === 'DELETE') {
        setNotes(prev => prev.filter(note => note.id !== payload.old.id));
      }
    };

    const subscription = supabase
      .channel('notes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, payload => {
        handleChanges(payload);
      })
      .subscribe();

    setLoading(false);

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  const addNote = async (note: NoteInsert) => {
    const { error } = await supabase
      .from('notes')
      .insert(note);

    if (error) {
      console.error('Error adding note:', error);
      showAlert('Error adding note', 'error');
      return;
    }
  };

  const deleteNote = async (note: Note) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', note.id);

    if (error) {
      console.error('Error deleting note:', error);
      showAlert('Error deleting note', 'error');
      return;
    }
  };

  const updateNote = async (note: Note) => {
    const { error } = await supabase
      .from('notes')
      .update(note)
      .eq('id', note.id);

    if (error) {
      console.error('Error updating note:', error);
      showAlert('Error updating note', 'error');
      return;
    }
  };

  const approveNote = async (note: Note) => {
    const user = users.find(user => user.id === note.user_id);

    if (!user) {
      console.error('User not found');
      showAlert('User not found', 'error');
      return;
    }

    if (note.target === 'account_balance') {
      let accountBalance = accountBalances.find(ab => ab.user_id === user.id && ab.category_id === note.category_id);
      console.log('Account balance', accountBalance)
      if (!accountBalance) {
        // Create a new account balance
        const accountBalanceInsert: AccountBalanceInsert = {
          user_id: user.id,
          category_id: note.category_id,
          balance: 0
        };

        addAccountBalance(accountBalanceInsert).then(ab => {
          if (ab) {
            console.log('Account balance created', ab)
            const transaction: TransactionInsert = {
              account_balance_id: ab.id,
              amount: note.amount,
              type: 'credit',
              target: note.target,
              category_id: note.category_id,
              source: 'NOTE'
            };

            addTransaction(transaction);
            console.log('Transaction created', transaction)
          }
        })
      } else {
        const transaction: TransactionInsert = {
          account_balance_id: accountBalance.id,
          amount: note.amount,
          type: 'credit',
          target: note.target,
          category_id: note.category_id,
          source: 'NOTE'
        };
        addTransaction(transaction);

      }
    } else if (note.target === 'baki') {
      const baki = bakis.find(baki => baki.user_id === user.id && baki.category_id === note.category_id);

      if (!baki) {
        // Create a new baki
        const bakiInsert: BakiInsert = {
          user_id: user.id,
          category_id: note.category_id,
          balance: 0
        };

        addBaki(bakiInsert).then(baki => {
          if (baki) {
            console.log('Baki created', baki)
            const transaction: TransactionInsert = {
              baki_id: baki.id,
              amount: note.amount,
              type: 'credit',
              target: note.target,
              category_id: note.category_id,
              source: 'NOTE'
            };

            addTransaction(transaction);
            console.log('Transaction created', transaction)
          }
        })
      } else {
        const transaction: TransactionInsert = {
          baki_id: baki.id,
          amount: note.amount,
          type: 'credit',
          target: note.target,
          category_id: note.category_id,
          source: 'NOTE'
        };

        addTransaction(transaction);
      }
    }

    await updateNote({
      ...note,
      status: 'APPROVED',
    });

  }

  const rejectNote = async (note: Note) => {
    await updateNote({
      ...note,
      status: 'REJECTED',
    });
  }

  return (
    <NoteContext.Provider value={{ notes, addNote, deleteNote, updateNote, approveNote, loading, rejectNote }}>
      {children}
    </NoteContext.Provider>
  );
}

export function useNoteContext() {
  const context = useContext(NoteContext);

  if (!context) {
    throw new Error('useNoteContext must be used within a NoteProvider');
  }

  return context;
}