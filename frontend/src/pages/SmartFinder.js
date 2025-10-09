import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch,
  FaTimes,
  FaClock,
  FaUsers,
  FaUtensils,
  FaGlobe,
  FaHeart,
  FaEye,
  FaSortAmountDown,
  FaMagic,
  FaLeaf,
  FaBolt,
  FaFire,
  FaStar,
  FaShare,
  FaSpinner,
  FaMapMarkerAlt,
  FaUser,
  FaAward,
  FaMicrophone,
  FaMicrophoneSlash,
  FaVolumeUp,
  FaRandom
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

// Configurable savings assumptions (₹)
const SAVINGS_CONFIG = {
  deliveryCost: 250,
  ingredientCost: 50,
};

const computeSavings = (delivery = SAVINGS_CONFIG.deliveryCost, ingredient = SAVINGS_CONFIG.ingredientCost) => {
  const amount = Math.max(0, delivery - ingredient);
  return { amount, text: `🎉 You just saved ₹${amount} by using leftovers instead of ordering food!` };
};

// Hash util for consistent image selection
const hashString = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

// Diverse local fallback images to avoid duplicates when recipe.image missing
const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=636&h=393&fit=crop&auto=format&q=80', // Indian curry
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=636&h=393&fit=crop&auto=format&q=80', // Pizza
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=636&h=393&fit=crop&auto=format&q=80', // Salad
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=636&h=393&fit=crop&auto=format&q=80', // Pasta
  'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=636&h=393&fit=crop&auto=format&q=80', // Stir fry
  'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=636&h=393&fit=crop&auto=format&q=80', // Chicken dish
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=636&h=393&fit=crop&auto=format&q=80', // Veg bowl
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=636&h=393&fit=crop&auto=format&q=80', // Mediterranean
  'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=636&h=393&fit=crop&auto=format&q=80', // Soup
  'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=636&h=393&fit=crop&auto=format&q=80'  // Sandwich
];

const getRecipeImage = (recipe, index = 0) => {
  const title = (recipe?.title || recipe?.name || 'recipe').toLowerCase();
  const cuisine = (recipe?.cuisines?.[0] || '').toLowerCase();
  const terms = [title, cuisine].filter(Boolean).join(' ');
  const sig = (hashString(terms) + index) % 1000;
  const query = encodeURIComponent(terms || 'food dish');
  return `https://source.unsplash.com/636x393/?${query}&sig=${sig}`;
};

const GUJARATI_SPECIALS = [
  {
    id: 'guj_dal_dhokli',
    title: 'Dal Dhokli (Gujarati Comfort Food)',
    cuisines: ['Gujarati', 'Indian'],
    image: 'https://cdn.pixabay.com/photo/2015/09/09/18/22/indian-food-933193_1280.jpg',
    fallback: 'https://images.unsplash.com/photo-1604908554027-08f25918e38a?w=900&h=600&fit=crop&auto=format&q=80',
    readyInMinutes: 45,
    servings: 4,
    rating: 4.6,
    source: 'curated',
    summary: 'Wheat flour dumplings simmered in a tangy-spicy dal. A wholesome, comforting one-pot meal from Gujarat.'
  },
  {
    id: 'guj_khaman_dhokla',
    title: 'Khaman Dhokla',
    cuisines: ['Gujarati', 'Indian'],
    image: 'https://cdn.pixabay.com/photo/2018/10/14/21/25/india-3741854_1280.jpg',
    fallback: 'https://images.unsplash.com/photo-1631452180519-a9b1b9a8efb2?w=900&h=600&fit=crop&auto=format&q=80',
    readyInMinutes: 30,
    servings: 4,
    rating: 4.7,
    source: 'curated',
    summary: 'Soft, fluffy steamed cake made from gram flour and tempered with mustard seeds and green chilies.'
  },
  {
    id: 'guj_thepla',
    title: 'Methi Thepla',
    cuisines: ['Gujarati', 'Indian'],
    image: 'https://cdn.pixabay.com/photo/2016/11/18/15/04/food-1833345_1280.jpg',
    fallback: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=900&h=600&fit=crop&auto=format&q=80',
    readyInMinutes: 35,
    servings: 6,
    rating: 4.5,
    source: 'curated',
    summary: 'Flatbreads flavored with fenugreek leaves and spices. Perfect for travel and tiffin.'
  },
  {
    id: 'guj_undhiyu',
    title: 'Undhiyu',
    cuisines: ['Gujarati', 'Indian'],
    image: 'https://cdn.pixabay.com/photo/2016/11/18/16/20/food-1834721_1280.jpg',
    fallback: 'https://images.unsplash.com/photo-1604908177735-9e3a9089c9e2?w=900&h=600&fit=crop&auto=format&q=80',
    readyInMinutes: 60,
    servings: 6,
    rating: 4.8,
    source: 'curated',
    summary: 'A hearty mixed vegetable delicacy from Surat, slow-cooked with spices and muthia.'
  },
  {
    id: 'guj_kadhi_khichdi',
    title: 'Kadhi-Khichdi',
    cuisines: ['Gujarati', 'Indian'],
    image: 'https://cdn.pixabay.com/photo/2016/03/05/19/02/asian-1238615_1280.jpg',
    fallback: 'https://images.unsplash.com/photo-1589927986089-35812388d1a3?w=900&h=600&fit=crop&auto=format&q=80',
    readyInMinutes: 30,
    servings: 4,
    rating: 4.6,
    source: 'curated',
    summary: 'Comforting yogurt-based curry served with spiced rice-lentil khichdi—soul food.'
  },
  {
    id: 'guj_handvo',
    title: 'Handvo',
    cuisines: ['Gujarati', 'Indian'],
    image: 'https://cdn.pixabay.com/photo/2015/03/26/09/39/bowl-690032_1280.jpg',
    fallback: 'https://images.unsplash.com/photo-1546549031-8eb8f1d5b42f?w=900&h=600&fit=crop&auto=format&q=80',
    readyInMinutes: 50,
    servings: 6,
    rating: 4.4,
    source: 'curated',
    summary: 'Savory lentil-rice cake with vegetables and sesame tempering; crispy outside, soft inside.'
  }
];


const splitSteps = (recipe) => {
  if (recipe?.analyzedInstructions?.[0]?.steps?.length) {
    return recipe.analyzedInstructions[0].steps.map(s => s.step || s.text).filter(Boolean);
  }
  const raw = (recipe?.instructions || '')
    .replace(/<[^>]*>/g, ' ')
    .split(/\n|\.|\r/)
    .map(s => s.trim())
    .filter(Boolean);
  if (raw.length) return raw;
  const title = (recipe?.title || '').toLowerCase();
  if (title.includes('dal') || title.includes('curry')) {
    return [
      'Heat oil or ghee and sauté onions until golden.',
      'Add ginger-garlic, then spices (cumin, coriander, turmeric).',
      'Add tomatoes and cook down to a masala.',
      'Add lentils/ingredients with water and simmer until tender.',
      'Season, garnish with coriander, and serve hot.'
    ];
  }
  return [
    'Prep ingredients and heat pan.',
    'Cook aromatics until fragrant.',
    'Add main ingredients and seasonings.',
    'Simmer/cook until done.',
    'Plate and serve.'
  ];
};

const computeGreenScore = (recipe = {}, inputIngredients = []) => {
  const title = (recipe.title || recipe.name || '').toLowerCase();
  const list = (recipe.extendedIngredients || []).map(i => (i.original || i.name || '').toLowerCase());
  const text = (title + ' ' + list.join(' ')).toLowerCase();
  let score = 50;
  const isVeg = /(dal|lentil|chana|rajma|paneer|tofu|veg|vegetable|sabzi|bhaji|salad|thepla|kadhi|khichdi)/.test(text);
  const hasLegumes = /(dal|lentil|chickpea|chana|rajma|moong|masoor)/.test(text);
  const hasRedMeat = /(mutton|beef|pork|lamb)/.test(text);
  const hasPoultry = /(chicken|turkey)/.test(text);
  score += isVeg ? 25 : 0;
  score += hasLegumes ? 15 : 0;
  score -= hasRedMeat ? 20 : 0;
  score -= hasPoultry ? 10 : 0;
  const time = recipe.readyInMinutes || 30;
  score += time <= 25 ? 10 : time <= 45 ? 5 : 0;
  const match = inputIngredients.length ? (inputIngredients.filter(i => text.includes(i.toLowerCase())).length / Math.max(1, inputIngredients.length)) : 0;
  score += match >= 0.7 ? 10 : match >= 0.4 ? 5 : 0;
  return Math.max(0, Math.min(100, Math.round(score)));
};

const getEcoBadges = (recipe, inputIngredients) => {
  const badges = [];
  const score = computeGreenScore(recipe, inputIngredients);
  if (score >= 80) badges.push({ text: 'Eco Hero', className: 'eco' });
  const text = (recipe.title || recipe.name || '').toLowerCase() + ' ' + (recipe.extendedIngredients||[]).map(i=> (i.original||'').toLowerCase()).join(' ');
  const zeroWaste = inputIngredients.length > 0 && inputIngredients.every(i => text.includes(i.toLowerCase()));
  if (zeroWaste) badges.push({ text: 'Zero Waste Chef', className: 'zeroWaste' });
  badges.push({ text: `Green ${score}`, className: 'eco' });
  return badges;
};

const FinderContainer = styled(motion.div)`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  min-height: calc(100vh - 80px);
  
  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const Header = styled(motion.div)`
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
  
  .main-title {
    font-size: 3rem;
    font-weight: 900;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 25%, #ff9ff3 50%, #54a0ff 75%, #5f27cd 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 1rem;
    letter-spacing: -0.5px;
    line-height: 1.1;

    @media (min-width: 768px) {
      font-size: 4rem;
    }

    .accent {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 25%, #ff9ff3 50%, #54a0ff 75%, #5f27cd 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      display: inline-block;
    }
  }
  
  .subtitle {
    font-size: 1.1rem;
    color: #4A5568;
    max-width: 700px;
    margin: 0 auto 2rem;
    line-height: 1.6;
    font-weight: 500;
    
    @media (min-width: 768px) {
      font-size: 1.3rem;
    }
  }
  
  .stats {
    display: flex;
    justify-content: center;
    gap: 3rem;
    margin-top: 2rem;
    flex-wrap: wrap;
    
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      
      .stat-icon {
        font-size: 2rem;
        color: #667eea;
        margin-bottom: 0.25rem;
      }
      
      .stat-number {
        font-size: 1.5rem;
        font-weight: 700;
        color: #2D3748;
      }
      
      .stat-label {
        font-size: 0.9rem;
        color: #718096;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }
    }
  }
`;

const SearchSection = styled(motion.div)`
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  border: 1px solid rgba(102, 126, 234, 0.1);
  
  @media (min-width: 768px) {
    padding: 3rem;
  }
`;

const SearchBar = styled.div`
  position: relative;
  margin-bottom: 2rem;
  
  .search-input {
    width: 100%;
    padding: 1.5rem 1.5rem 1.5rem 4rem;
    border: 3px solid #E2E8F0;
    border-radius: 20px;
    font-size: 1.2rem;
    transition: all 0.3s ease;
    background: #F7FAFC;
    color: #2D3748;
    font-weight: 500;
    
    &:focus {
      outline: none;
      border-color: #667eea;
      background: white;
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
      transform: translateY(-2px);
    }
    
    &::placeholder {
      color: #A0AEC0;
      font-weight: 400;
    }
  }
  
  .search-icon {
    position: absolute;
    left: 1.5rem;
    top: 50%;
    transform: translateY(-50%);
    color: #667eea;
    font-size: 1.4rem;
  }
  
  .suggestions-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #E2E8F0;
    border-radius: 16px;
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    margin-top: 0.5rem;
    
    .suggestion-item {
      padding: 1rem 1.5rem;
      cursor: pointer;
      border-bottom: 1px solid #F7FAFC;
      transition: all 0.2s ease;
      
      &:hover {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
        transform: translateX(4px);
      }
      
      &:last-child {
        border-bottom: none;
      }
      
      .suggestion-text {
        font-weight: 600;
        color: #2D3748;
        margin-bottom: 0.25rem;
      }
      
      .suggestion-category {
        font-size: 0.8rem;
        color: #718096;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }
  }
`;

const IngredientTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  min-height: 80px;
  padding: 1.5rem;
  border: 3px dashed #E2E8F0;
  border-radius: 20px;
  background: linear-gradient(135deg, #F7FAFC 0%, #EDF2F7 100%);
  transition: all 0.3s ease;
  
  &.has-ingredients {
    border-color: #667eea;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
    border-style: solid;
  }
  
  .empty-state {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #A0AEC0;
    font-style: italic;
    text-align: center;
    
    .empty-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      opacity: 0.5;
    }
  }
`;

const IngredientTag = styled(motion.div)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.75rem 1.25rem;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 600;
  font-size: 0.95rem;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  cursor: default;
  
  .remove-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
`;

const ActionButton = styled(motion.button).withConfig({
  shouldForwardProp: (prop) => prop !== 'primary'
})`
  background: ${props => props.primary ?
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
    'linear-gradient(135deg, #718096 0%, #4A5568 100%)'
  };
  color: white;
  border: none;
  padding: 1.25rem 2.5rem;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  min-width: 180px;
  justify-content: center;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .button-icon {
    font-size: 1.2rem;
  }
`;

const SavingsBanner = styled.div`
  margin-top: 0.75rem;
  background: linear-gradient(135deg, #48BB78 0%, #38A169 100%);
  color: #fff;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
`;

const StepCounter = styled.div`
  text-align: center;
  color: #718096;
  margin-bottom: 0.5rem;
`;

const GuideStep = styled.div`
  margin-bottom: 1rem;
`;

const QuickSuggestions = styled.div`
  margin-top: 2rem;
  
  .suggestions-title {
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: #2D3748;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    .title-icon {
      color: #667eea;
      font-size: 1.4rem;
    }
  }
  
  .suggestions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
  }
  
  .suggestion-category {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: 1px solid #E2E8F0;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }
    
    .category-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      
      .category-icon {
        color: #667eea;
        font-size: 1.2rem;
      }
      
      h4 {
        color: #2D3748;
        font-size: 1.1rem;
        margin: 0;
        font-weight: 700;
      }
    }
    
    .suggestion-items {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  }
`;

const SuggestionChip = styled(motion.button)`
  background: #F7FAFC;
  color: #4A5568;
  border: 2px solid #E2E8F0;
  padding: 0.75rem 1rem;
  border-radius: 50px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
    border-color: transparent;
  }
`;

const SpecialsSection = styled.div`
  margin-top: 2rem;

  .title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.3rem;
    font-weight: 800;
    color: #2D3748;
    margin-bottom: 1rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
  }
`;

const SpecialCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #E2E8F0;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.12);
  }
`;

const SpecialImage = styled.div`
  height: 180px;
  overflow: hidden;
  border-radius: 12px;
  margin-bottom: 12px;

  img { width: 100%; height: 100%; object-fit: cover; }
`;

const SpecialTitle = styled.div`
  font-weight: 800;
  color: #2D3748;
  margin-bottom: 6px;
`;

const SpecialSummary = styled.div`
  color: #718096;
  font-size: 0.9rem;
`;

const ResultsSection = styled(motion.div)`
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.1);
  
  @media (min-width: 768px) {
    padding: 3rem;
  }
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
  
  .results-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #2D3748;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    @media (min-width: 768px) {
      font-size: 1.8rem;
    }
  }
  
  .results-count {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 900;
  }
  
  .sort-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
    
    .sort-select {
      padding: 0.75rem 1rem;
      border: 2px solid #E2E8F0;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      background: white;
      color: #4A5568;
      
      &:focus {
        outline: none;
        border-color: #667eea;
      }
    }
  }
`;

const RecipeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  
  @media (min-width: 1200px) {
    grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  }
`;

const RecipeCard = styled(motion.div)`
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid #F0F0F0;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    border-color: #667eea;
  }
  
  .recipe-image-container {
    position: relative;
    height: 250px;
    overflow: hidden;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    
    .recipe-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    &:hover .recipe-image {
      transform: scale(1.05);
    }
    
    .recipe-badges {
      position: absolute;
      top: 1rem;
      left: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .recipe-badge {
      background: rgba(255, 255, 255, 0.95);
      color: #2D3748;
      padding: 0.4rem 0.8rem;
      border-radius: 50px;
      font-size: 0.75rem;
      font-weight: 700;
      backdrop-filter: blur(10px);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      
      &.quick {
        background: linear-gradient(135deg, #48BB78 0%, #38A169 100%);
        color: white;
      }
      
      &.healthy {
        background: linear-gradient(135deg, #4FD1C7 0%, #319795 100%);
        color: white;
      }
      
      &.popular {
        background: linear-gradient(135deg, #ED8936 0%, #DD6B20 100%);
        color: white;
      }
      
      &.indian {
        background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
        color: white;
      }
      &.eco {
        background: linear-gradient(135deg, #48BB78 0%, #38A169 100%);
        color: white;
      }
      &.zeroWaste {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: white;
      }
    }

    .favorite-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(255, 255, 255, 0.95);
      border: none;
      border-radius: 50%;
      width: 45px;
      height: 45px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      
      &:hover {
        background: white;
        transform: scale(1.1);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      }
      
      &.favorited {
        background: linear-gradient(135deg, #F56565 0%, #E53E3E 100%);
        color: white;
      }
    }
    
    .cuisine-flag {
      position: absolute;
      bottom: 1rem;
      left: 1rem;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 50px;
      font-size: 0.8rem;
      font-weight: 600;
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }
  
  .recipe-content {
    padding: 2rem;
    
    .recipe-title {
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: #2D3748;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .recipe-summary {
      color: #718096;
      font-size: 0.95rem;
      margin-bottom: 1.5rem;
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .recipe-meta {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #F7FAFC;
      border-radius: 12px;
      
      .meta-item {
        text-align: center;
        
        .meta-icon {
          color: #667eea;
          margin-bottom: 0.5rem;
          font-size: 1.2rem;
        }
        
        .meta-label {
          font-size: 0.75rem;
          color: #A0AEC0;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        
        .meta-value {
          font-size: 0.9rem;
          font-weight: 700;
          color: #2D3748;
        }
      }
    }
    
    .recipe-rating {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      padding: 0.75rem;
      background: linear-gradient(135deg, #FFF5F5 0%, #FED7D7 100%);
      border-radius: 12px;
      
      .stars {
        color: #F6AD55;
        font-size: 1rem;
      }
      
      .rating-value {
        font-weight: 700;
        color: #2D3748;
        font-size: 1rem;
      }
      
      .rating-label {
        font-size: 0.8rem;
        color: #718096;
        font-weight: 600;
      }
    }
    
    .recipe-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      
      .action-btn {
        background: #F7FAFC;
        border: 2px solid #E2E8F0;
        color: #4A5568;
        padding: 1rem;
        border-radius: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        font-weight: 600;
        transition: all 0.3s ease;
        
        &:hover {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        
        &.favorited {
          background: linear-gradient(135deg, #F56565 0%, #E53E3E 100%);
          color: white;
          border-color: transparent;
        }
        
        &.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
          
          &:hover {
            background: linear-gradient(135deg, #5A67D8 0%, #6B46C1 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
          }
        }
      }
    }
  }
`;

const LoadingSpinner = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  
  .spinner {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    color: #667eea;
  }
  
  .loading-text {
    color: #4A5568;
    font-size: 1.2rem;
    text-align: center;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  .loading-tip {
    color: #718096;
    font-size: 1rem;
    margin-top: 0.5rem;
    text-align: center;
    max-width: 400px;
  }
`;

const EmptyState = styled(motion.div)`
  text-align: center;
  padding: 4rem 2rem;
  color: #718096;
  
  .empty-icon {
    font-size: 5rem;
    margin-bottom: 2rem;
    opacity: 0.3;
    color: #A0AEC0;
  }
  
  h3 {
    margin-bottom: 1rem;
    color: #2D3748;
    font-size: 1.5rem;
    font-weight: 700;
  }
  
  p {
    max-width: 500px;
    margin: 0 auto 2rem;
    line-height: 1.6;
    font-size: 1.1rem;
  }
  
  .empty-suggestions {
    margin-top: 2rem;
    
    .suggestion-list {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1rem;
      margin-top: 1rem;
    }
  }
`;

// Recipe Detail Modal Components
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const ModalContent = styled(motion.div)`
  background: white;
  border-radius: 24px;
  max-width: 1200px;
  width: 100%;
  max-height: 95vh;
  overflow-y: auto;
  box-shadow: 0 25px 100px rgba(0, 0, 0, 0.3);
  position: relative;

  @media (max-width: 768px) {
    max-width: 95%;
    border-radius: 16px;
  }
`;

const ModalHeader = styled.div`
  position: relative;
  height: 300px;
  overflow: hidden;
  
  .modal-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: none;
    border-radius: 50%;
    width: 45px;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(0, 0, 0, 0.7);
      transform: scale(1.1);
    }
  }
  
  .modal-title {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
    color: white;
    padding: 2rem;
    
    h2 {
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }
  }
`;

const ModalBody = styled.div`
  padding: 0;

  .recipe-content-grid {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 2rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
  }

  .recipe-sidebar {
    background: #F8F9FA;
    padding: 2rem;

    @media (max-width: 768px) {
      padding: 1.5rem;
    }
  }

  .recipe-main {
    padding: 2rem;

    @media (max-width: 768px) {
      padding: 1.5rem;
    }
  }

  .recipe-meta-detailed {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;

    .meta-card {
      background: white;
      padding: 1rem;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      .meta-icon {
        font-size: 1.5rem;
        color: #667eea;
        margin-bottom: 0.5rem;
      }

      .meta-label {
        font-size: 0.8rem;
        color: #718096;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 0.25rem;
        font-weight: 600;
      }

      .meta-value {
        font-size: 1rem;
        font-weight: 700;
        color: #2D3748;
      }
    }
  }

  .recipe-ingredients {
    margin-bottom: 2rem;

    h3 {
      color: #2D3748;
      font-size: 1.2rem;
      margin-bottom: 1rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .ingredients-list {
      list-style: none;
      padding: 0;

      .ingredient-item {
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        background: white;
        border-radius: 8px;
        border-left: 3px solid #667eea;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

        .ingredient-icon {
          color: #667eea;
          font-size: 0.9rem;
        }

        .ingredient-text {
          color: #4A5568;
          font-size: 0.95rem;
          font-weight: 500;
          line-height: 1.4;
        }

        .ingredient-amount {
          color: #2D3748;
          font-weight: 600;
          margin-left: auto;
          font-size: 0.9rem;
        }
      }
    }
  }

  .recipe-nutrition {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    h4 {
      color: #2D3748;
      font-size: 1.1rem;
      margin-bottom: 1rem;
      font-weight: 700;
    }

    .nutrition-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;

      .nutrition-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        background: #F7FAFC;
        border-radius: 6px;
        font-size: 0.9rem;

        .label {
          color: #718096;
          font-weight: 500;
        }

        .value {
          color: #2D3748;
          font-weight: 600;
        }
      }
    }
  }

  .recipe-description {
    margin-bottom: 2rem;

    h3 {
      color: #2D3748;
      font-size: 1.3rem;
      margin-bottom: 1rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    p {
      color: #4A5568;
      line-height: 1.6;
      font-size: 1rem;
    }
  }

  .recipe-instructions {
    margin-bottom: 2rem;

    h3 {
      color: #2D3748;
      font-size: 1.3rem;
      margin-bottom: 1rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .instructions-list {
      list-style: none;
      padding: 0;

      .instruction-step {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        padding: 1.25rem;
        background: #F7FAFC;
        border-radius: 12px;
        border-left: 4px solid #667eea;
        transition: all 0.2s ease;

        &:hover {
          background: #EDF2F7;
          transform: translateX(2px);
        }

        .step-number {
          background: #667eea;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        .step-text {
          color: #4A5568;
          line-height: 1.6;
          font-size: 0.95rem;
        }
      }
    }
  }

  .recipe-tips {
    background: #FFF5F5;
    padding: 1.5rem;
    border-radius: 12px;
    border-left: 4px solid #F56565;
    margin-bottom: 2rem;

    h4 {
      color: #2D3748;
      font-size: 1.1rem;
      margin-bottom: 1rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    ul {
      list-style: none;
      padding: 0;

      li {
        color: #4A5568;
        margin-bottom: 0.5rem;
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        font-size: 0.95rem;
        line-height: 1.5;

        &:before {
          content: "💡";
          flex-shrink: 0;
        }
      }
    }
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
    padding: 2rem;
    background: #F8F9FA;
    border-radius: 0 0 24px 24px;

    .modal-btn {
      flex: 1;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 1rem;

      &.primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
      }

      &.secondary {
        background: white;
        color: #4A5568;
        border: 2px solid #E2E8F0;

        &:hover {
          background: #EDF2F7;
          border-color: #CBD5E0;
          transform: translateY(-1px);
        }
      }

      &.favorite {
        background: #F56565;
        color: white;
        border: none;

        &:hover {
          background: #E53E3E;
          transform: translateY(-2px);
        }
      }
    }
  }
`;

const SmartFinder = () => {
  const { favorites, toggleFavorite, isFavorite, isAuthenticated, user } = useAuth();

  const [showGuide, setShowGuide] = React.useState(false);
  const [guideSteps, setGuideSteps] = React.useState([]);
  const [guideIndex, setGuideIndex] = React.useState(0);
  const [guideRecipe, setGuideRecipe] = React.useState(null);

  const openGuide = (recipe) => {
    const steps = splitSteps(recipe);
    setGuideSteps(steps);
    setGuideIndex(0);
    setGuideRecipe(recipe);
    setShowGuide(true);
  };
  const closeGuide = () => setShowGuide(false);

  // Load saved state from localStorage
  const loadSavedState = () => {
    try {
      const savedState = localStorage.getItem('smartFinderState');
      return savedState ? JSON.parse(savedState) : null;
    } catch (error) {
      console.error('Error loading saved state:', error);
      return null;
    }
  };

  const savedState = loadSavedState();

  const [ingredients, setIngredients] = useState(savedState?.ingredients || []);
  const [currentInput, setCurrentInput] = useState('');
  const [recipes, setRecipes] = useState(savedState?.recipes || []);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(savedState?.hasSearched || false);
  const [sortBy, setSortBy] = useState(savedState?.sortBy || 'relevance');
  const [filters, setFilters] = useState(savedState?.filters || {
    cuisine: '',
    diet: '',
    maxTime: '',
    difficulty: ''
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const inputRef = useRef(null);

  // Surprise Me rotation state
  const [surpriseIndex, setSurpriseIndex] = useState(-1);
  const [surprisePoolKey, setSurprisePoolKey] = useState('');

  // Save state to localStorage whenever key state changes
  useEffect(() => {
    const stateToSave = {
      ingredients,
      recipes,
      hasSearched,
      sortBy,
      filters,
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem('smartFinderState', JSON.stringify(stateToSave));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }, [ingredients, recipes, hasSearched, sortBy, filters]);

  // Show notification when previous search state is restored
  useEffect(() => {
    const savedState = loadSavedState(); // Load fresh to avoid stale closures
    if (savedState && (savedState.ingredients.length > 0 || savedState.recipes.length > 0)) {
      const timeDiff = new Date() - new Date(savedState.timestamp);
      const minutesAgo = Math.floor(timeDiff / (1000 * 60));

      let timeText = 'just now';
      if (minutesAgo > 60) {
        timeText = `${Math.floor(minutesAgo / 60)} hour${Math.floor(minutesAgo / 60) > 1 ? 's' : ''} ago`;
      } else if (minutesAgo > 0) {
        timeText = `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`;
      }

      toast.success(`Previous search restored from ${timeText}`, {
        icon: '🔄',
        style: {
          borderRadius: '12px',
          background: '#667eea',
          color: '#fff',
          fontWeight: '600'
        },
      });
    }
  }, []); // Only run once on component mount

  // Enhanced suggestion categories with Indian focus
  const suggestionCategories = [
    {
      title: 'Indian Staples',
      icon: <FaFire />,
      items: ['chapati', 'roti', 'rice', 'dal', 'paneer', 'curry leaves', 'turmeric', 'garam masala']
    },
    {
      title: 'Thali Essentials',
      icon: <FaUtensils />,
      items: ['sambar', 'rasam', 'curd rice', 'pickle', 'papad', 'sabzi', 'rajma', 'chole']
    },
    {
      title: 'Popular Proteins',
      icon: <FaBolt />,
      items: ['chicken', 'mutton', 'fish', 'egg', 'tofu', 'paneer', 'turkey', 'prawns']
    },
    {
      title: 'Fresh Vegetables',
      icon: <FaLeaf />,
      items: ['spinach', 'broccoli', 'cauliflower', 'potato', 'onion', 'tomato', 'capsicum', 'okra']
    },
    {
      title: 'Indian Spices',
      icon: <FaMagic />,
      items: ['cumin', 'coriander', 'cardamom', 'cinnamon', 'cloves', 'bay leaves', 'mustard seeds', 'hing']
    },
    {
      title: 'Global Favorites',
      icon: <FaGlobe />,
      items: ['pasta', 'bread', 'cheese', 'olive oil', 'basil', 'garlic', 'ginger', 'soy sauce']
    }
  ];

  // Auto-complete suggestions
  const allIngredients = suggestionCategories.flatMap(cat => cat.items);
  const filteredSuggestions = allIngredients.filter(item => 
    item.toLowerCase().includes(currentInput.toLowerCase()) && 
    !ingredients.includes(item.toLowerCase())
  ).slice(0, 8);

  const addIngredient = (ingredient = currentInput.trim().toLowerCase()) => {
    if (ingredient && !ingredients.includes(ingredient)) {
      setIngredients(prev => [...prev, ingredient]);
      setCurrentInput('');
      setShowSuggestions(false);
      toast.success(`Added "${ingredient}"`, {
        icon: '✅',
        style: {
          borderRadius: '12px',
          background: '#48BB78',
          color: '#fff',
          fontWeight: '600'
        },
      });
    } else if (ingredients.includes(ingredient)) {
      toast.error('Ingredient already added!', {
        icon: '⚠️',
        style: {
          borderRadius: '12px',
          background: '#F56565',
          color: '#fff',
          fontWeight: '600'
        },
      });
    }
  };

  const removeIngredient = (ingredient) => {
    setIngredients(prev => prev.filter(ing => ing !== ingredient));
    toast.success(`Removed "${ingredient}"`, {
      icon: '🗑️',
      style: {
        borderRadius: '12px',
        background: '#718096',
        color: '#fff',
        fontWeight: '600'
      },
    });
  };

  const addSuggestion = (ingredient) => {
    addIngredient(ingredient.toLowerCase());
  };

  // Multiple API Integration
  const searchRecipesFromMultipleAPIs = async (searchIngredients) => {
    const allRecipes = [];

    try {
      // API 1: Our enhanced local search with Spoonacular
      const primaryResponse = await axios.post('/api/recipes/search-by-ingredients', {
        ingredients: searchIngredients,
        matchType: 'any',
        useSpoonacular: true,
        limit: 24,
        filters
      }, { timeout: 7000 });

      if (primaryResponse.data.recipes) {
        allRecipes.push(...primaryResponse.data.recipes);
      }

      if (allRecipes.length >= 20) return allRecipes;

      // API 2: Recipe Puppy API (for additional variety)
      try {
        const recipePuppyResponse = await axios.get(`https://recipe-puppy.p.rapidapi.com/`, {
          params: {
            i: searchIngredients.slice(0, 3).join(','),
            p: '1'
          },
          headers: {
            'X-RapidAPI-Host': 'recipe-puppy.p.rapidapi.com',
            'X-RapidAPI-Key': 'your-rapidapi-key-here' // Would need to be configured
          },
          timeout: 5000
        });
        
        if (recipePuppyResponse.data?.results) {
          const formattedRecipes = recipePuppyResponse.data.results.map((recipe, index) => ({
            id: `recipepuppy_${index}`,
            title: recipe.title,
            image: recipe.thumbnail || 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=636&h=393&fit=crop&auto=format&q=80',
            sourceUrl: recipe.href,
            readyInMinutes: 30,
            servings: 4,
            rating: 4.0,
            cuisines: [],
            source: 'recipepuppy'
          }));
          allRecipes.push(...formattedRecipes);
        }
      } catch (apiError) {
        console.log('Recipe Puppy API not available:', apiError.message);
      }

      // API 3: Edamam Recipe API (backup)
      try {
        const edamamResponse = await axios.get('https://api.edamam.com/search', {
          params: {
            q: searchIngredients.join(' '),
            app_id: 'your-edamam-app-id',
            app_key: 'your-edamam-app-key',
            from: 0,
            to: 20
          },
          timeout: 5000
        });
        
        if (edamamResponse.data?.hits) {
          const formattedRecipes = edamamResponse.data.hits.map((hit, index) => ({
            id: `edamam_${index}`,
            title: hit.recipe.label,
            image: hit.recipe.image,
            sourceUrl: hit.recipe.url,
            readyInMinutes: hit.recipe.totalTime || 30,
            servings: hit.recipe.yield || 4,
            rating: 4.2,
            cuisines: hit.recipe.cuisineType || [],
            source: 'edamam',
            healthLabels: hit.recipe.healthLabels || []
          }));
          allRecipes.push(...formattedRecipes);
        }
      } catch (apiError) {
        console.log('Edamam API not available:', apiError.message);
      }

    } catch (error) {
      console.error('Error searching multiple APIs:', error);
    }

    return allRecipes;
  };

  const searchRecipes = async () => {
    if (ingredients.length === 0) {
      toast.error('Please add at least one ingredient!', {
        icon: '🥘',
        style: {
          borderRadius: '12px',
          background: '#F56565',
          color: '#fff',
          fontWeight: '600'
        },
      });
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const foundRecipes = await searchRecipesFromMultipleAPIs(ingredients);
      
      if (foundRecipes.length === 0) {
        // Provide intelligent suggestions based on ingredients
        const suggestionMessage = ingredients.length === 1
          ? `No recipes found for "${ingredients[0]}". Try adding more ingredients like onion, garlic, or tomato.`
          : `No recipes found for: ${ingredients.join(', ')}. Try simpler combinations or check ingredient spelling.`;

        toast.error(suggestionMessage, {
          icon: '🤔',
          duration: 8000,
          style: {
            borderRadius: '12px',
            background: '#F56565',
            color: '#fff',
            fontWeight: '600'
          },
        });
        setRecipes([]);
      } else {
        // Remove duplicates by title
        const uniqueRecipes = foundRecipes.filter((recipe, index, self) =>
          index === self.findIndex(r => r.title.toLowerCase() === recipe.title.toLowerCase())
        );
        
        setRecipes(uniqueRecipes);
        toast.success(`Found ${uniqueRecipes.length} delicious recipes!`, {
          icon: '🎉',
          style: {
            borderRadius: '12px',
            background: '#48BB78',
            color: '#fff',
            fontWeight: '600'
          },
        });
      }

    } catch (error) {
      console.error('Search error:', error);

      let errorMessage = 'Search failed. Please try again.';
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Search timed out. Please try with fewer ingredients.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your network.';
      }

      toast.error(errorMessage, {
        icon: '❌',
        duration: 6000,
        style: {
          borderRadius: '12px',
          background: '#F56565',
          color: '#fff',
          fontWeight: '600'
        },
      });
      setRecipes([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggleFavorite = (recipe) => {
    const wasAdded = toggleFavorite(recipe);

    if (wasAdded) {
      toast.success('Added to favorites', {
        icon: '❤️',
        style: {
          borderRadius: '12px',
          background: '#F56565',
          color: '#fff',
          fontWeight: '600'
        },
      });
    } else {
      toast.success('Removed from favorites', {
        icon: '💔',
        style: {
          borderRadius: '12px',
          background: '#718096',
          color: '#fff',
          fontWeight: '600'
        },
      });
    }
  };

  const viewRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRecipe(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addIngredient();
    }
  };

  const clearAll = () => {
    setIngredients([]);
    setCurrentInput('');
    setRecipes([]);
    setHasSearched(false);
    setSortBy('relevance');
    setFilters({
      cuisine: '',
      diet: '',
      maxTime: '',
      difficulty: ''
    });

    // Clear saved state
    try {
      localStorage.removeItem('smartFinderState');
    } catch (error) {
      console.error('Error clearing saved state:', error);
    }

    toast.success('Cleared all data and reset search', {
      icon: '🧹',
      style: {
        borderRadius: '12px',
        background: '#718096',
        color: '#fff',
        fontWeight: '600'
      },
    });
  };

  const generateStars = (rating) => {
    const stars = Math.floor(rating || 0);
    const hasHalf = (rating % 1) >= 0.5;
    return '★'.repeat(stars) + (hasHalf ? '��' : '') + '☆'.repeat(Math.max(0, 5 - stars - (hasHalf ? 1 : 0)));
  };

  const sortRecipes = (recipesToSort) => {
    const sorted = [...recipesToSort];
    switch (sortBy) {
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'time':
        return sorted.sort((a, b) => (a.readyInMinutes || 30) - (b.readyInMinutes || 30));
      case 'popularity':
        return sorted.sort((a, b) => (b.aggregateLikes || 0) - (a.aggregateLikes || 0));
      case 'relevance':
      default:
        return sorted.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }
  };

  const getRecipeBadges = (recipe, inputIngredients) => {
    const badges = [];
    if (recipe.readyInMinutes && recipe.readyInMinutes <= 30) {
      badges.push({ text: 'Quick', className: 'quick' });
    }
    if (recipe.healthScore && recipe.healthScore > 70) {
      badges.push({ text: 'Healthy', className: 'healthy' });
    }
    if (recipe.aggregateLikes && recipe.aggregateLikes > 100) {
      badges.push({ text: 'Popular', className: 'popular' });
    }
    if ((recipe.cuisines && recipe.cuisines.some(c => c.toLowerCase().includes('indian'))) ||
        (recipe.title && (recipe.title.toLowerCase().includes('curry') ||
                         recipe.title.toLowerCase().includes('dal') ||
                         recipe.title.toLowerCase().includes('roti') ||
                         recipe.title.toLowerCase().includes('chapati')))) {
      badges.push({ text: 'Indian', className: 'indian' });
    }
    const eco = getEcoBadges(recipe, inputIngredients);
    eco.forEach(b => badges.push(b));
    return badges;
  };

  const sortedRecipes = React.useMemo(() => sortRecipes(recipes), [recipes, sortBy]);

  return (
    <FinderContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <Header
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <h1 className="main-title">
          <span className="accent">Smart Recipe</span> Finder
        </h1>
        <p className="subtitle">
          Discover amazing recipes from around the world using your available ingredients. 
          Specializing in Indian cuisine and authentic flavors.
        </p>
        <div className="stats">
          <div className="stat-item">
            <FaUtensils className="stat-icon" />
            <div className="stat-number">15,000+</div>
            <div className="stat-label">Recipes</div>
          </div>
          <div className="stat-item">
            <FaGlobe className="stat-icon" />
            <div className="stat-number">50+</div>
            <div className="stat-label">Cuisines</div>
          </div>
          <div className="stat-item">
            <FaMagic className="stat-icon" />
            <div className="stat-number">3</div>
            <div className="stat-label">APIs</div>
          </div>
          <div className="stat-item">
            <FaAward className="stat-icon" />
            <div className="stat-number">AI</div>
            <div className="stat-label">Powered</div>
          </div>
        </div>
      </Header>

      <SearchSection
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <SearchBar>
          <FaSearch className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            value={currentInput}
            onChange={(e) => {
              setCurrentInput(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(currentInput.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Type an ingredient (e.g., chicken, rice, dal, paneer)..."
          />
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {filteredSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => addIngredient(suggestion)}
                >
                  <div className="suggestion-text">{suggestion}</div>
                  <div className="suggestion-category">
                    {suggestionCategories.find(cat => cat.items.includes(suggestion))?.title || 'Ingredient'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SearchBar>

        <IngredientTags className={ingredients.length > 0 ? 'has-ingredients' : ''}>
          <AnimatePresence>
            {ingredients.map((ingredient, index) => (
              <IngredientTag
                key={ingredient}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <span>{ingredient}</span>
                <button
                  className="remove-btn"
                  onClick={() => removeIngredient(ingredient)}
                >
                  <FaTimes />
                </button>
              </IngredientTag>
            ))}
          </AnimatePresence>
          {ingredients.length === 0 && (
            <div className="empty-state">
              <FaUtensils className="empty-icon" />
              <div>Add ingredients above to start finding recipes...</div>
            </div>
          )}
        </IngredientTags>

        <ActionButtons>
          <ActionButton
            primary
            onClick={searchRecipes}
            disabled={ingredients.length === 0 || isSearching}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isSearching ? (
              <>
                <motion.div
                  className="button-icon"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <FaSpinner />
                </motion.div>
                Searching...
              </>
            ) : (
              <>
                <FaSearch className="button-icon" />
                Find Recipes
              </>
            )}
          </ActionButton>

          <ActionButton
            onClick={() => {
              try {
                const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (!SR) {
                  toast.error('Voice not supported in this browser');
                  return;
                }
                const rec = new SR();
                rec.lang = 'en-IN';
                rec.interimResults = false;
                rec.maxAlternatives = 1;
                rec.onresult = (e) => {
                  const transcript = e.results[0][0].transcript || '';
                  const cleaned = transcript.toLowerCase().replace(/chef[, ]*/g,'').replace(/what can i make with /,'');
                  const parts = cleaned.split(/,| and | with /).map(s=>s.trim()).filter(Boolean);
                  if (parts.length) {
                    setIngredients(Array.from(new Set(parts)));
                    toast.success(`Heard: ${parts.join(', ')}`, { icon: '🎙️' });
                  }
                };
                rec.onerror = () => {};
                rec.start();
              } catch (e) {
                toast.error('Unable to start voice');
              }
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ rotate: 10, scale: 0.98 }}
          >
            <FaMicrophone className="button-icon" />
            Voice
          </ActionButton>

          <ActionButton
            onClick={() => {
              try {
                const utter = new SpeechSynthesisUtterance();
                const text = ingredients.length ? `Searching recipes with ${ingredients.join(', ')}` : 'Add ingredients or try Surprise Me.';
                utter.text = text;
                utter.lang = 'en-IN';
                window.speechSynthesis && window.speechSynthesis.speak(utter);
              } catch {}
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaVolumeUp className="button-icon" />
            Speak
          </ActionButton>

          <ActionButton
            onClick={async () => {
              const pool = recipes.length ? recipes : GUJARATI_SPECIALS;
              const poolKey = recipes.length ? 'results' : 'gujarat';
              // reset if pool changed
              let baseIndex = surpriseIndex;
              if (surprisePoolKey !== poolKey) baseIndex = -1;
              const nextIndex = (baseIndex + 1) % Math.max(1, pool.length);
              setSurpriseIndex(nextIndex);
              setSurprisePoolKey(poolKey);
              const pick = pool[nextIndex];
              if (pick) {
                setSelectedRecipe(pick);
                setShowModal(true);
              }
              // confetti burst
              const end = Date.now() + 800;
              const frame = () => {
                const colors = ['#667eea','#764ba2','#22c55e','#f59e0b','#ef4444'];
                const el = document.createElement('div');
                el.style.position='fixed';
                el.style.top='-10px';
                el.style.left=Math.random()*100+'%';
                el.style.width='8px';
                el.style.height='8px';
                el.style.borderRadius='50%';
                el.style.background=colors[Math.floor(Math.random()*colors.length)];
                el.style.zIndex=99999;
                el.style.transform=`translateY(0)`;
                el.style.transition='transform 1s ease, opacity 1s ease';
                document.body.appendChild(el);
                requestAnimationFrame(()=>{
                  el.style.transform=`translateY(${window.innerHeight+20}px)`;
                  el.style.opacity='0';
                });
                setTimeout(()=>document.body.removeChild(el),1200);
                if (Date.now()<end) requestAnimationFrame(frame);
              };
              frame();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ rotate: 360, scale: 0.95 }}
          >
            <FaRandom className="button-icon" />
            Surprise Me
          </ActionButton>

          {ingredients.length > 0 && (
            <ActionButton
              onClick={clearAll}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaTimes className="button-icon" />
              Clear All
            </ActionButton>
          )}
        </ActionButtons>

        <QuickSuggestions>
          <div className="suggestions-title">
            <FaMagic className="title-icon" />
            Quick Add Ingredients
          </div>
          <div className="suggestions-grid">
            {suggestionCategories.map((category, index) => (
              <motion.div
                key={category.title}
                className="suggestion-category"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
              >
                <div className="category-header">
                  <div className="category-icon">{category.icon}</div>
                  <h4>{category.title}</h4>
                </div>
                <div className="suggestion-items">
                  {category.items.map((item) => (
                    <SuggestionChip
                      key={item}
                      onClick={() => addSuggestion(item)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {item}
                    </SuggestionChip>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </QuickSuggestions>

      </SearchSection>

      <AnimatePresence>
        {hasSearched && (
          <ResultsSection
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
          >
            <ResultsHeader>
              <div className="results-title">
                <FaUtensils />
                <span className="results-count">{sortedRecipes.length}</span> 
                {sortedRecipes.length === 1 ? 'Recipe Found' : 'Recipes Found'}
              </div>
              {sortedRecipes.length > 0 && (
                <div className="sort-controls">
                  <FaSortAmountDown />
                  <select
                    className="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="relevance">Best Match</option>
                    <option value="rating">Highest Rated</option>
                    <option value="time">Quickest</option>
                    <option value="popularity">Most Popular</option>
                  </select>
                </div>
              )}
            </ResultsHeader>

            {isSearching ? (
              <LoadingSpinner>
                <motion.div
                  className="spinner"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  🔍
                </motion.div>
                <div className="loading-text">Searching across multiple recipe databases...</div>
                <div className="loading-tip">
                  We're checking Spoonacular, Recipe Puppy, and other APIs to find you the perfect recipes!
                </div>
              </LoadingSpinner>
            ) : sortedRecipes.length > 0 ? (
              <RecipeGrid>
                {sortedRecipes.map((recipe, index) => {
                  const badges = getRecipeBadges(recipe, ingredients);
                  const recipeId = recipe._id || recipe.id || index;
                  
                  return (
                    <RecipeCard
                      key={recipeId}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="recipe-image-container">
                        <img
                          src={getRecipeImage(recipe, index)}
                          alt={recipe.title || recipe.name}
                          className="recipe-image"
                          loading="lazy"
                          onError={(e) => {
                            const title = (recipe?.title || recipe?.name || 'recipe').toLowerCase();
                            const cuisine = (recipe?.cuisines?.[0] || '').toLowerCase();
                            const fallbackIndex = (hashString(title + cuisine) + index) % FALLBACK_IMAGES.length;
                            e.target.src = FALLBACK_IMAGES[fallbackIndex];
                          }}
                        />
                        
                        <div className="recipe-badges">
                          {badges.map((badge, idx) => (
                            <div key={idx} className={`recipe-badge ${badge.className}`}>
                              {badge.text}
                            </div>
                          ))}
                        </div>
                        
                        <button
                          className={`favorite-btn ${isFavorite(recipe) ? 'favorited' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(recipe);
                          }}
                        >
                          <FaHeart />
                        </button>

                        {recipe.cuisines && recipe.cuisines.length > 0 && (
                          <div className="cuisine-flag">
                            <FaMapMarkerAlt />
                            {recipe.cuisines[0]}
                          </div>
                        )}
                      </div>
                      
                      <div className="recipe-content">
                        <div className="recipe-title">{recipe.title || recipe.name}</div>
                        
                        {recipe.summary && (
                          <div className="recipe-summary">
                            {recipe.summary.replace(/<[^>]*>/g, '').substring(0, 150)}...
                          </div>
                        )}
                        
                        <div className="recipe-meta">
                          <div className="meta-item">
                            <FaClock className="meta-icon" />
                            <div className="meta-label">Time</div>
                            <div className="meta-value">{recipe.readyInMinutes || 30}m</div>
                          </div>
                          <div className="meta-item">
                            <FaUsers className="meta-icon" />
                            <div className="meta-label">Serves</div>
                            <div className="meta-value">{recipe.servings || 4}</div>
                          </div>
                          <div className="meta-item">
                            <FaUser className="meta-icon" />
                            <div className="meta-label">Source</div>
                            <div className="meta-value">{recipe.source || 'Local'}</div>
                          </div>
                        </div>
                        
                        <div className="recipe-rating">
                          <span className="stars">
                            {generateStars(recipe.rating || recipe.spoonacularScore/20 || 4)}
                          </span>
                          <span className="rating-value">
                            {(recipe.rating || recipe.spoonacularScore/20 || 4).toFixed(1)}
                          </span>
                          <span className="rating-label">rating</span>
                        </div>
                        {hasSearched && (() => {
                          const s = computeSavings();
                          return (
                            <SavingsBanner>
                              {s.text}
                            </SavingsBanner>
                          );
                        })()}
                        
                        <div className="recipe-actions">
                          <button
                            className={`action-btn ${isFavorite(recipe) ? 'favorited' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(recipe);
                            }}
                          >
                            <FaHeart />
                            {isFavorite(recipe) ? 'Saved' : 'Save'}
                          </button>
                          
                          <button
                            className="action-btn primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewRecipe(recipe);
                            }}
                          >
                            <FaEye />
                            View Recipe
                          </button>
                          <button
                            className="action-btn primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              openGuide(recipe);
                            }}
                          >
                            👨‍🍳 Start Cooking
                          </button>
                          <button
                            className="action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = (() => {
                                const id = recipe._id || recipe.id || (recipe.title || 'recipe').toLowerCase().replace(/[^a-z0-9]+/g,'-');
                                const origin = window.location.origin;
                                return isAuthenticated ? `${origin}/recipe/${id}` : origin;
                              })();
                              const text = `I made this with my leftovers 💚 – Try it here: ${link}`;
                              if (navigator.share) {
                                navigator.share({ title: recipe.title, text, url: link }).catch(()=>{});
                                toast.success('Share dialog opened');
                              } else {
                                navigator.clipboard.writeText(text).then(() => {
                                  toast.success('✅ Link copied to clipboard!');
                                }).catch(() => toast.success('✅ Link copied to clipboard!'));
                              }
                            }}
                          >
                            <FaShare /> Share Recipe
                          </button>
                        </div>
                      </div>
                    </RecipeCard>
                  );
                })}
              </RecipeGrid>
            ) : (
              <EmptyState
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <FaSearch className="empty-icon" />
                <h3>No recipes found</h3>
                <p>
                  Don't worry! Try different ingredients or check the spelling. 
                  Our multiple APIs search through thousands of recipes worldwide!
                </p>
                <div className="empty-suggestions">
                  <p><strong>Try popular Indian combinations:</strong></p>
                  <div className="suggestion-list">
                    {['rice + dal', 'chapati + paneer', 'potato + onion', 'chicken + curry leaves', 'tomato + garam masala'].map((combo) => (
                      <SuggestionChip
                        key={combo}
                        onClick={() => {
                          const ingredients = combo.split(' + ');
                          setIngredients(ingredients);
                          toast.success(`Added: ${combo}`, { 
                            icon: '✨',
                            style: {
                              borderRadius: '12px',
                              background: '#48BB78',
                              color: '#fff',
                              fontWeight: '600'
                            },
                          });
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {combo}
                      </SuggestionChip>
                    ))}
                  </div>
                </div>
              </EmptyState>
            )}
          </ResultsSection>
        )}
      </AnimatePresence>

      {/* Step-by-step Cooking Guide */}
      <AnimatePresence>
        {showGuide && guideRecipe && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeGuide}
          >
            <ModalContent
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <img
                  src={getRecipeImage(guideRecipe)}
                  alt={guideRecipe.title}
                  className="modal-image"
                />
                <button className="modal-close" onClick={closeGuide}>
                  <FaTimes />
                </button>
                <div className="modal-title">
                  <h2>Cooking Guide: {guideRecipe.title}</h2>
                </div>
              </ModalHeader>
              <ModalBody>
                {(() => {
                  const limit = isAuthenticated ? guideSteps.length : Math.min(2, guideSteps.length);
                  const locked = !isAuthenticated && guideIndex >= 2;
                  return (
                    <div>
                      <GuideStep className="instruction-step">
                        <div className="step-number">{Math.min(guideIndex + 1, limit)}</div>
                        <div className="step-text">{locked ? '🔒 Sign up to unlock the full step-by-step cooking mode.' : guideSteps[guideIndex]}</div>
                      </GuideStep>
                      <StepCounter>
                        Step {Math.min(guideIndex + 1, limit)} / {limit}
                      </StepCounter>
                      <div className="modal-actions">
                        <button className="modal-btn secondary" onClick={closeGuide}>Close</button>
                        <button
                          className="modal-btn primary"
                          onClick={() => {
                            if (locked) return;
                            if (guideIndex + 1 < limit) setGuideIndex(guideIndex + 1);
                          }}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </ModalBody>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Recipe Details Modal */}
      <AnimatePresence>
        {showModal && selectedRecipe && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <ModalContent
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <img
                  src={selectedRecipe.image || `https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=900&h=300&fit=crop&auto=format&q=80`}
                  alt={selectedRecipe.title}
                  className="modal-image"
                />
                <button className="modal-close" onClick={closeModal}>
                  <FaTimes />
                </button>
                <div className="modal-title">
                  <h2>{selectedRecipe.title}</h2>
                </div>
              </ModalHeader>
              
              <ModalBody>
                <div className="recipe-content-grid">
                  {/* Left Sidebar - Ingredients & Info */}
                  <div className="recipe-sidebar">
                    <div className="recipe-meta-detailed">
                      <div className="meta-card">
                        <FaClock className="meta-icon" />
                        <div className="meta-label">Cook Time</div>
                        <div className="meta-value">{selectedRecipe.readyInMinutes || 30} min</div>
                      </div>
                      <div className="meta-card">
                        <FaUsers className="meta-icon" />
                        <div className="meta-label">Servings</div>
                        <div className="meta-value">{selectedRecipe.servings || 4}</div>
                      </div>
                      <div className="meta-card">
                        <FaStar className="meta-icon" />
                        <div className="meta-label">Rating</div>
                        <div className="meta-value">{(selectedRecipe.rating || 4).toFixed(1)}</div>
                      </div>
                      <div className="meta-card">
                        <FaGlobe className="meta-icon" />
                        <div className="meta-label">Cuisine</div>
                        <div className="meta-value">{selectedRecipe.cuisines?.[0] || 'Global'}</div>
                      </div>
                    </div>

                    <div className="recipe-ingredients">
                      <h3>
                        <FaUtensils />
                        Ingredients
                      </h3>
                      <div className="ingredients-list">
                        {selectedRecipe.extendedIngredients ? (
                          selectedRecipe.extendedIngredients.map((ingredient, index) => (
                            <div key={index} className="ingredient-item">
                              <div className="ingredient-icon">��</div>
                              <div className="ingredient-text">{ingredient.original}</div>
                              <div className="ingredient-amount">
                                {ingredient.amount ? `${ingredient.amount} ${ingredient.unit}` : ''}
                              </div>
                            </div>
                          ))
                        ) : (
                          // Generate intelligent ingredients based on recipe title and metadata
                          (() => {
                            const title = selectedRecipe.title?.toLowerCase() || '';
                            let ingredients = [];

                            if (title.includes('curry') || title.includes('indian')) {
                              ingredients = [
                                { text: 'Onions, diced', amount: '2 medium' },
                                { text: 'Garlic cloves, minced', amount: '3-4' },
                                { text: 'Ginger, grated', amount: '1 inch' },
                                { text: 'Tomatoes, chopped', amount: '2 large' },
                                { text: 'Spices (cumin, coriander, turmeric)', amount: '2 tsp each' },
                                { text: 'Oil or ghee', amount: '2 tbsp' },
                                { text: 'Salt to taste', amount: '' }
                              ];
                            } else if (title.includes('pasta')) {
                              ingredients = [
                                { text: 'Pasta', amount: '400g' },
                                { text: 'Olive oil', amount: '3 tbsp' },
                                { text: 'Garlic, minced', amount: '3 cloves' },
                                { text: 'Tomatoes or sauce', amount: '400g' },
                                { text: 'Fresh herbs', amount: '1/4 cup' },
                                { text: 'Parmesan cheese', amount: '1/2 cup' },
                                { text: 'Salt and pepper', amount: 'to taste' }
                              ];
                            } else if (title.includes('salad')) {
                              ingredients = [
                                { text: 'Mixed greens', amount: '4 cups' },
                                { text: 'Cherry tomatoes', amount: '1 cup' },
                                { text: 'Cucumber, sliced', amount: '1 medium' },
                                { text: 'Red onion, sliced', amount: '1/4 cup' },
                                { text: 'Olive oil', amount: '3 tbsp' },
                                { text: 'Lemon juice', amount: '2 tbsp' },
                                { text: 'Salt and pepper', amount: 'to taste' }
                              ];
                            } else {
                              ingredients = [
                                { text: 'Main protein or base ingredient', amount: '400g' },
                                { text: 'Onion, diced', amount: '1 medium' },
                                { text: 'Garlic, minced', amount: '2-3 cloves' },
                                { text: 'Cooking oil', amount: '2 tbsp' },
                                { text: 'Seasonings and spices', amount: 'to taste' },
                                { text: 'Fresh herbs for garnish', amount: '2 tbsp' }
                              ];
                            }

                            return ingredients.map((ingredient, index) => (
                              <div key={index} className="ingredient-item">
                                <div className="ingredient-icon">🥄</div>
                                <div className="ingredient-text">{ingredient.text}</div>
                                <div className="ingredient-amount">{ingredient.amount}</div>
                              </div>
                            ));
                          })()
                        )}
                      </div>
                    </div>

                    <div className="recipe-nutrition">
                      <h4>����️ Nutrition Info (per serving)</h4>
                      <div className="nutrition-grid">
                        <div className="nutrition-item">
                          <span className="label">Calories</span>
                          <span className="value">{selectedRecipe.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || '250'} kcal</span>
                        </div>
                        <div className="nutrition-item">
                          <span className="label">Protein</span>
                          <span className="value">{selectedRecipe.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || '15'} g</span>
                        </div>
                        <div className="nutrition-item">
                          <span className="label">Carbs</span>
                          <span className="value">{selectedRecipe.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || '30'} g</span>
                        </div>
                        <div className="nutrition-item">
                          <span className="label">Fat</span>
                          <span className="value">{selectedRecipe.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || '12'} g</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Main Content - Instructions & Description */}
                  <div className="recipe-main">
                    <div className="recipe-description">
                      <h3>
                        📖 About This Recipe
                      </h3>
                      <p>
                        {selectedRecipe.summary ?
                          selectedRecipe.summary.replace(/<[^>]*>/g, '') :
                          `This delicious ${selectedRecipe.title} combines wonderful flavors and textures to create a memorable dish. Perfect for ${selectedRecipe.cuisines?.[0] || 'any'} cuisine lovers, this recipe serves ${selectedRecipe.servings || 4} people and takes about ${selectedRecipe.readyInMinutes || 30} minutes to prepare and cook. Great for both beginners and experienced cooks!`
                        }
                      </p>
                    </div>

                    <div className="recipe-instructions">
                      <h3>
                        👨‍🍳 Instructions
                      </h3>
                      <div className="instructions-list">
                        {selectedRecipe.analyzedInstructions?.[0]?.steps ? (
                          selectedRecipe.analyzedInstructions[0].steps.map((step, index) => (
                            <div key={index} className="instruction-step">
                              <div className="step-number">{step.number}</div>
                              <div className="step-text">{step.step}</div>
                            </div>
                          ))
                        ) : (
                          (() => {
                            const title = selectedRecipe.title?.toLowerCase() || '';
                            let instructions = [];

                            if (title.includes('curry') || title.includes('indian')) {
                              instructions = [
                                "Heat oil or ghee in a large pan over medium heat. Add chopped onions and cook until golden brown.",
                                "Add minced garlic and grated ginger. Cook for 1-2 minutes until fragrant.",
                                "Add spices (cumin, coriander, turmeric) and cook for 30 seconds until aromatic.",
                                "Add chopped tomatoes and cook until they break down into a sauce.",
                                "Add your main ingredients and enough water to create desired consistency.",
                                "Simmer for 15-20 minutes until ingredients are cooked through.",
                                "Season with salt, garnish with fresh cilantro, and serve hot with rice or bread."
                              ];
                            } else if (title.includes('pasta')) {
                              instructions = [
                                "Bring a large pot of salted water to boil. Cook pasta according to package directions until al dente.",
                                "While pasta cooks, heat olive oil in a large pan over medium heat.",
                                "Add minced garlic and cook for 1 minute until fragrant.",
                                "Add tomatoes or sauce and simmer for 5-10 minutes.",
                                "Drain pasta, reserving 1 cup of pasta water.",
                                "Add pasta to the sauce, tossing with a little pasta water if needed.",
                                "Serve immediately topped with fresh herbs and parmesan cheese."
                              ];
                            } else {
                              instructions = [
                                "Gather all ingredients and prepare your cooking space with necessary equipment.",
                                "Heat cooking oil in a suitable pan or pot over medium heat.",
                                "Add aromatics like onions and garlic, cooking until fragrant and translucent.",
                                "Add main ingredients and cook according to the specific requirements of the dish.",
                                "Season with salt, pepper, and other spices to taste throughout cooking.",
                                "Cook until ingredients are properly done and flavors are well combined.",
                                "Garnish with fresh herbs if desired and serve hot. Enjoy your delicious meal!"
                              ];
                            }

                            return instructions.map((step, index) => (
                              <div key={index} className="instruction-step">
                                <div className="step-number">{index + 1}</div>
                                <div className="step-text">{step}</div>
                              </div>
                            ));
                          })()
                        )}
                      </div>
                    </div>

                    <div className="recipe-tips">
                      <h4>💡 Chef's Tips</h4>
                      <ul>
                        <li>Taste and adjust seasonings as you cook for the best flavor balance.</li>
                        <li>Use fresh ingredients when possible for maximum taste and nutrition.</li>
                        <li>Don't rush the cooking process - good food takes time!</li>
                        <li>Feel free to adjust spice levels according to your preference.</li>
                        <li>Store leftovers in the refrigerator for up to 3 days.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    className={`modal-btn ${isFavorite(selectedRecipe) ? 'favorite' : 'secondary'}`}
                    onClick={() => handleToggleFavorite(selectedRecipe)}
                  >
                    <FaHeart />
                    {isFavorite(selectedRecipe) ? 'Saved' : 'Save Recipe'}
                  </button>

                  <button
                    className="modal-btn primary"
                    onClick={() => {
                      if (selectedRecipe.sourceUrl) {
                        window.open(selectedRecipe.sourceUrl, '_blank');
                      } else {
                        toast.success('Recipe details shown above! Use the ingredients and instructions to cook.', {
                          icon: '👨‍🍳',
                          duration: 4000,
                          style: {
                            borderRadius: '12px',
                            background: '#48BB78',
                            color: '#fff',
                            fontWeight: '600'
                          },
                        });
                      }
                    }}
                  >
                    <FaShare />
                    {selectedRecipe.sourceUrl ? 'View Original' : 'Start Cooking'}
                  </button>
                </div>
              </ModalBody>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </FinderContainer>
  );
};

export default SmartFinder;
