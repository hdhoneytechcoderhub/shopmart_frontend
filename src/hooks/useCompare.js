import { useSelector, useDispatch } from 'react-redux';
import { addToCompare, removeFromCompare, clearCompare, selectCompareItems, COMPARE_MAX_ITEMS } from '../redux/slices/compareSlice';
import toast from 'react-hot-toast';

export const useCompare = () => {
  const items = useSelector(selectCompareItems);
  const dispatch = useDispatch();

  const isComparing = (id) => items.some((p) => p.id === id);

  const toggle = (product) => {
    if (isComparing(product.id)) {
      dispatch(removeFromCompare(product.id));
      return;
    }
    if (items.length >= COMPARE_MAX_ITEMS) {
      toast.error(`You can compare up to ${COMPARE_MAX_ITEMS} products at a time`);
      return;
    }
    dispatch(addToCompare(product));
    toast.success(`${product.name} added to compare`);
  };

  const remove = (id) => dispatch(removeFromCompare(id));
  const clear = () => dispatch(clearCompare());

  return { items, isComparing, toggle, remove, clear, max: COMPARE_MAX_ITEMS };
};

export default useCompare;
