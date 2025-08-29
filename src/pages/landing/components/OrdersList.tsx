import React, { useEffect, useMemo, useState } from "react";
import { Card, Badge } from "flowbite-react";
import { useOrderContext } from "../../../context/product/OrderContext";
import { useAuthContext } from "../../../context/AuthContext";
import { supabase } from "../../../utils/supabaseClient";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../../utils/pointsConfig";

interface OrderWithMeta {
  id: string;
  created_at: string;
  total_amount: number | null;
  shipping_address: string | null;
  itemsCount: number;
}

const OrdersList: React.FC = () => {
  const { user } = useAuthContext();
  const { orders } = useOrderContext();
  const [display, setDisplay] = useState<OrderWithMeta[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadOrdersWithItems = async () => {
      if (!user?.id) {
        setDisplay([]);
        return;
      }
      const mine = orders.filter((o) => o.user_id === user.id);
      
      // Fetch order items counts for each order
      const mapped: OrderWithMeta[] = await Promise.all(
        mine.map(async (o) => {
          const { data: items, error } = await supabase
            .from("order_items")
            .select("amount")
            .eq("order_id", o.id);
          
          if (error) {
            console.error("Error fetching order items:", error);
          }
          
          const itemsCount = (items || []).reduce((sum, item) => sum + (item.amount || 0), 0);
          
          return {
            id: o.id,
            created_at: o.created_at,
            total_amount: o.total_amount,
            shipping_address: o.shipping_address,
            itemsCount,
          };
        })
      );
      setDisplay(mapped);
    };

    loadOrdersWithItems();
  }, [orders, user]);

  const hasOrders = useMemo(() => display.length > 0, [display]);

  const handleOrderClick = (orderId: string): void => {
    navigate(`/order-details/${orderId}`);
  };

  return (
    <div className="space-y-4">
      {!hasOrders && (
        <Card>
          <div className="text-center py-8 text-gray-600 dark:text-gray-300">
            No orders yet.
          </div>
        </Card>
      )}

      {hasOrders && (
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
          {display.map((o) => (
            <Card key={o.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" onClick={() => handleOrderClick(o.id)}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">#{o.id}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(o.created_at).toLocaleDateString()} · {o.itemsCount} items
                  </p>
                  {o.shipping_address && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate max-w-xl">
                      {o.shipping_address}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <Badge color="info" className="mb-2">Placed</Badge>
                  <div className="text-gray-900 dark:text-white font-semibold">
                    {typeof o.total_amount === "number" ? formatCurrency(o.total_amount) : formatCurrency(0)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersList;


