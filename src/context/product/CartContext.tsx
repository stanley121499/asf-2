import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
} from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../../database.types";
import { useAlertContext } from "../AlertContext";

export type AddToCart = Database["public"]["Tables"]["add_to_carts"]["Row"];
export type Categories = { add_to_carts: AddToCart[] };
export type AddToCartInsert =
  Database["public"]["Tables"]["add_to_carts"]["Insert"];
export type AddToCartUpdate =
  Database["public"]["Tables"]["add_to_carts"]["Update"];

interface AddToCartContextProps {
  add_to_carts: AddToCart[];
  createAddToCart: (addToCart: AddToCartInsert) => Promise<void>;
  updateAddToCart: (addToCart: AddToCartUpdate) => Promise<void>;
  deleteAddToCart: (addToCartId: string) => Promise<void>;
  loading: boolean;
}

const AddToCartContext = createContext<AddToCartContextProps>(undefined!);

export function AddToCartProvider({ children }: PropsWithChildren) {
  const [add_to_carts, setCategories] = useState<AddToCart[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);

    const fetchCategories = async () => {
      const { data: add_to_carts, error } = await supabase
        .from("add_to_carts")
        .select("*")

      if (error) {
        showAlert(error.message, "error");
        return;
      }

      setCategories(add_to_carts);
    };

    fetchCategories();

    const handleChanges = (payload: any) => {
      console.log(payload.eventType);
      if (payload.eventType === "INSERT") {
        setCategories((prev) => [...prev, payload.new]);
      }

      if (payload.eventType === "UPDATE") {
        setCategories((prev) =>
          prev.map((addToCart) =>
            addToCart.id === payload.new.id ? payload.new : addToCart
          )
        );
      }

      if (payload.eventType === "DELETE") {
        setCategories((prev) =>
          prev.filter((addToCart) => addToCart.id !== payload.old.id)
        );
      }
    };

    const subscription = supabase
      .channel("add_to_carts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "add_to_carts" },
        (payload) => {
          handleChanges(payload);
        }
      )
      .subscribe();

    setLoading(false);

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  const createAddToCart = async (addToCart: AddToCartInsert) => {
    const { error } = await supabase.from("add_to_carts").insert(addToCart);
    if (error) {
      showAlert(error.message, "error");
      console.log(error.message);
      return;
    }
  };

  const updateAddToCart = async (addToCart: AddToCartUpdate) => {
    const { error } = await supabase
      .from("add_to_carts")
      .update(addToCart)
      .eq("id", addToCart.id);
    if (error) {
      showAlert(error.message, "error");
      console.log(error.message);
      return;
    }
  };

  const deleteAddToCart = async (addToCartId: string) => {
    const { error } = await supabase
      .from("add_to_carts")
      .delete()
      .match({ id: addToCartId });
    if (error) {
      showAlert(error.message, "error");
      console.log(error.message);
      return;
    }
  };

  return (
    <AddToCartContext.Provider
      value={{
        add_to_carts,
        createAddToCart,
        updateAddToCart,
        deleteAddToCart,
        loading,
      }}>
      {children}
    </AddToCartContext.Provider>
  );
}

export function useAddToCartContext() {
  const context = useContext(AddToCartContext);

  if (!context) {
    throw new Error(
      "useAddToCartContext must be used within a AddToCartProvider"
    );
  }

  return context;
}
