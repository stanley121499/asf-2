import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import { TransactionInsert, useTransactionContext } from "./TransactionContext";
import { useUserContext } from "./UserContext";
import { useBakiContext } from "./BakiContext";
import { useAccountBalanceContext } from "./AccountBalanceContext";

export type Result = Database['public']['Tables']['results']['Row'];
export type Results = { results: Result[] };
export type ResultInsert = Database['public']['Tables']['results']['Insert'];

interface ResultContextProps {
  results: Result[];
  addResult: (result: ResultInsert) => void;
  deleteResult: (result: Result) => void;
  updateResult: (result: Result) => void;
  loading: boolean;
}

const ResultContext = createContext<ResultContextProps>(undefined!);

export function ResultProvider({ children }: PropsWithChildren) {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();
  const { addTransaction, transactions, deleteTransaction } = useTransactionContext();
  const { users } = useUserContext();
  const { bakis, addBaki } = useBakiContext();
  const { accountBalances, addAccountBalance } = useAccountBalanceContext();

  useEffect(() => {
    const fetchResults = async () => {
      const { data: results, error } = await supabase
        .from('results')
        .select('*')
        .order('id' , { ascending: false });

      if (error) {
        console.error('Error fetching results:', error);
        showAlert('Error fetching results', 'error');
      }

      setResults(results || []);
      setLoading(false);
    };

    fetchResults();

    const handleChanges = (payload: any) => {
      if (payload.eventType === 'INSERT') {
        setResults(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setResults(prev => prev.map(result => result.id === payload.new.id ? payload.new : result));
      } else if (payload.eventType === 'DELETE') {
        setResults(prev => prev.filter(result => result.id !== payload.old.id));
      }
    };

    const subscription = supabase
      .channel('results')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, payload => {
        handleChanges(payload);
      })
      .subscribe();

    setLoading(false);
    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  const addResult = async (result: ResultInsert) => {    
    setLoading(true);

    // Process Result to add Transaction, check line by line for result.result and create a transaction
    const lines = result.result.split('\n');

    lines.forEach(async line => {
      // Each line will be in the format of "amount username"
      const [amount, username] = line.split(' ');

      // if invalid line, skip
      if (!amount || !username) {
        return;
      }

      // find user_id from username
      const user = users.find(u => u.email.includes(username));

      // Create a transaction
      if ( result.target === 'account_balance') {
        let accountBalance = accountBalances.find(ab => ab.user_id === user?.id && ab.category_id === result.category_id);
        
        if (!accountBalance && user) {
          accountBalance = await addAccountBalance({
            user_id: user?.id,
            category_id: result.category_id,
            balance: 0,
          });
        }

        const transaction: TransactionInsert = {
          amount: amount.startsWith('-') ? parseFloat(amount) : parseFloat(amount) * -1,
          target: 'account_balance',
          account_balance_id: accountBalance?.id,
          type: amount.startsWith('-') ? 'credit' : 'debit',
          user_id: user?.id,
          category_id: result.category_id,
          source: 'RESULT',
        };

        addTransaction(transaction);
      } else if (result.target === 'baki') {
        let baki = bakis.find(baki => baki.user_id === user?.id && baki.category_id === result.category_id);

        if (!baki && user) {
          baki = await addBaki({
            user_id: user?.id,
            category_id: result.category_id,
            balance: 0,
          });
        }

        const transaction: TransactionInsert = {
          amount: amount.startsWith('-') ? parseFloat(amount) : parseFloat(amount) * -1,
          target: 'baki',
          type: amount.startsWith('-') ? 'credit' : 'debit',
          user_id: user?.id,
          baki_id: baki?.id,
          category_id: result.category_id,
          source: 'RESULT',
        };

        addTransaction(transaction);
      }

    });

    const { error } = await supabase
      .from('results')
      .insert(result);

    if (error) {
      console.error('Error adding result:', error);
      showAlert('Error adding result', 'error');
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  const deleteResult = async (result: Result) => {
    const { error } = await supabase
      .from('results')
      .delete()
      .eq('id', result.id);

    if (error) {
      console.error('Error deleting result:', error);
      showAlert('Error deleting result', 'error');
      return;
    }

  };

  const updateResult = async (result: Result) => {
    setLoading(true);

    // Find all the old transactions and delete them
    const oldTransactions = transactions.filter(transaction => transaction.result_id === result.id);

    oldTransactions.forEach(transaction => {
      deleteTransaction(transaction);
    });

    // Process Result to add Transaction, check line by line for result.result and create a transaction
    const lines = result.result.split('\n');

    lines.forEach(async line => {
      // Each line will be in the format of "amount username"
      const [amount, username] = line.split(' ');

      // if invalid line, skip
      if (!amount || !username) {
        return;
      }

      // find user_id from username
      const user = users.find(u => u.email.includes(username));

      // Create a transaction
      if ( result.target === 'account_balance') {
        let accountBalance = accountBalances.find(ab => ab.user_id === user?.id && ab.category_id === result.category_id);

        if (!accountBalance && user) {
          accountBalance = await addAccountBalance({
            user_id: user?.id,
            category_id: result.category_id,
            balance: 0,
          });          
        }

        const transaction: TransactionInsert = {
          amount: amount.startsWith('-') ? parseFloat(amount) : parseFloat(amount) * -1,
          target: 'account_balance',
          account_balance_id: accountBalance?.id,
          type: amount.startsWith('-') ? 'credit' : 'debit',
          user_id: user?.id,
          category_id: result.category_id,
          source: 'RESULT',
        };

        addTransaction(transaction);
      } else if (result.target === 'baki') {
        let baki = bakis.find(baki => baki.user_id === user?.id && baki.category_id === result.category_id);

        if (!baki && user) {
          baki = await addBaki({
            user_id: user?.id,
            category_id: result.category_id,
            balance: 0,
          });
        }

        const transaction: TransactionInsert = {
          amount: amount.startsWith('-') ? parseFloat(amount) : parseFloat(amount) * -1,
          target: 'baki',
          type: amount.startsWith('-') ? 'credit' : 'debit',
          user_id: user?.id,
          category_id: result.category_id,
          baki_id: baki?.id,
          source: 'RESULT',
        };

        addTransaction(transaction);
      }

    });

    const { error } = await supabase
      .from('results')
      .update(result)
      .eq('id', result.id);

    if (error) {
      console.error('Error updating result:', error);
      showAlert('Error updating result', 'error');
      return;
    }

    setLoading(false);
  }

  return (
    <ResultContext.Provider value={{ results, addResult, deleteResult, updateResult, loading }}>
      {children}
    </ResultContext.Provider>
  );
}

export function useResultContext() {
  const context = useContext(ResultContext);

  if (!context) {
    throw new Error('useResultContext must be used within a ResultProvider');
  }

  return context;
}