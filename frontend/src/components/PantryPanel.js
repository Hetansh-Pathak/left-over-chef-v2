import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { pantryGet, pantrySave, pantryRemove } from '../services/api';
import toast from 'react-hot-toast';
import { playSizzle } from '../services/audio';

const Panel = styled.div`
  width: 320px;
  padding: 1rem;
  background: rgba(255,255,255,0.96);
  border-radius: 12px;
  box-shadow: ${props => props.theme.shadows.card};
  position: relative;
`;

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow: auto;
`;

const ItemRow = styled.div`
  display:flex;align-items:center;justify-content:space-between;padding:8px;border-radius:8px;background:#fff;border:1px solid #eee;
`;

const AddRow = styled.div`display:flex;gap:8px;margin-top:8px;`;

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
    <Panel>
      <h3>Your Pantry</h3>
      <ItemList>
        {items.map((it, idx)=> (
          <ItemRow key={idx}>
            <div>{it.name}</div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>remove(it.name)}>Remove</button>
            </div>
          </ItemRow>
        ))}
        {items.length===0 && <div style={{color:'#718096'}}>Pantry empty — add ingredients you have.</div>}
      </ItemList>

      <AddRow>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Add ingredient" />
        <button onClick={add}>Add</button>
      </AddRow>
    </Panel>
  );
}
