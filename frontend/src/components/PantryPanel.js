import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaShoppingBasket, FaTrashAlt, FaPlus } from 'react-icons/fa';
import { pantryGet, pantrySave, pantryRemove } from '../services/api';
import toast from 'react-hot-toast';
import { playSizzle } from '../services/audio';

const Panel = styled(motion.div)`
  width: 320px;
  padding: 1rem;
  background: rgba(255,255,255,0.96);
  border-radius: 12px;
  box-shadow: ${props => props.theme.shadows.card};
  position: relative;
  border: 1px solid #f0f0f0;
`;

const TitleBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: ${props => props.theme.colors.textDark};
  .icon { color: ${props => props.theme.colors.primary}; }
  h3 { margin: 0; font-size: 1.1rem; font-weight: 800; }
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow: auto;
`;

const ItemRow = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #eee;
`;

const RemoveButton = styled(motion.button)`
  background: #FFF5F5;
  border: 1px solid #FED7D7;
  color: #E53E3E;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
`;

const EmptyState = styled.div`
  color: #718096;
`;

const Controls = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const Input = styled.input`
  flex: 1;
  border: 2px solid #E2E8F0;
  border-radius: 10px;
  padding: 0.6rem 0.8rem;
  font-weight: 600;
  color: #2D3748;
  &:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.15); }
`;

const AddButton = styled(motion.button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.6rem 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 800;
  cursor: pointer;
`;

export default function PantryPanel({ userId='demo', onChange }){
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');

  const load = async ()=>{
    try{
      const data = await pantryGet(userId);
      setItems(data.items || []);
    }catch(e){ console.error(e); }
  };

  useEffect(()=>{ load(); },[]);

  const add = async ()=>{
    if(!name.trim()) return toast.error('Enter an ingredient');
    const newItem = { name: name.trim(), addedAt: new Date() };
    const updated = [...items, newItem];
    try{
      await pantrySave(updated, userId);
      setItems(updated); setName('');
      playSizzle();
      toast.success('Added to pantry');
      onChange && onChange(updated);
    }catch(e){ toast.error('Could not save'); }
  };

  const remove = async (n)=>{
    try{
      await pantryRemove(n, userId);
      const updated = items.filter(i=> (i.name||'').toLowerCase() !== n.toLowerCase());
      setItems(updated);
      toast.success('Removed');
      onChange && onChange(updated);
    }catch(e){ toast.error('Could not remove'); }
  };

  return (
    <Panel initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <TitleBar>
        <FaShoppingBasket className="icon" />
        <h3>Your Pantry</h3>
      </TitleBar>

      <ItemList>
        {items.map((it, idx)=> (
          <ItemRow key={idx} whileHover={{ scale: 1.01 }}>
            <div>{it.name}</div>
            <RemoveButton whileHover={{ scale: 1.05 }} onClick={()=>remove(it.name)}>
              <FaTrashAlt /> Remove
            </RemoveButton>
          </ItemRow>
        ))}
        {items.length===0 && <EmptyState>Pantry empty — add ingredients you have.</EmptyState>}
      </ItemList>

      <Controls>
        <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Add ingredient" />
        <AddButton whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={add}>
          <FaPlus /> Add
        </AddButton>
      </Controls>
    </Panel>
  );
}
