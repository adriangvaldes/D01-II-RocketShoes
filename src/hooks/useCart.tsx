import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}
interface UpdateProductAmount {
  productId: number;
  amount: number;
}
interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);


export function CartProvider({ children }: CartProviderProps): JSX.Element {  
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')
    
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });
  // localStorage.setItem('@RocketShoes:cart', '')
  
  const addProduct = async (productId: number) => {
    try {
      if(cart.filter(product => product.id === productId).length === 0){
        const productData:Product = (await api.get(`products/${productId}`)).data

        const cartAux = [...cart, { ...productData, amount: 1 }]
        
        setCart(cartAux);
        
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartAux));
        
      } else {
        const productDataStock:Stock = (await api.get(`stock/${productId}`)).data
        const [product] = cart.filter(product => product.id ===  productId)
        
        if(product.amount < productDataStock.amount) {

          const cartAux = (cart.map(product => {        
            if(product.id === productId) {
              product.amount ++
            }
            return product
          }))

          setCart(cartAux)
    
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartAux))
          
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }      
    } catch {
      toast.error('Erro na adição do produto');
    }   
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(cartProduct => cartProduct.id !== productId)

      if (newCart.length < cart.length){
        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      } else 
          toast.error('Erro na remoção do produto');
    } catch {
        toast.error('Erro na remoção do produto');      
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // const newCart = cart.filter(cartProduct => cartProduct.id !== productId)
      // const productAtt = cart.find(cartProduct => cartProduct.id === productId)!

      const productDataStock:Stock = (await api.get(`stock/${productId}`)).data

      if (amount < 1){
        return 
      } else { 
        if (productDataStock.amount < amount){    
          toast.error('Quantidade solicitada fora de estoque');
        } else {
            const cartAux = cart.map(product => {
              if (product.id === productId){
                return {
                  ...product,
                  amount: amount
                }
              } else{ 
                return { ...product }
              }
             
            })

            setCart(cartAux)
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartAux))
          }  
      }      
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
