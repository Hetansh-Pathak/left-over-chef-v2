import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaStar, FaClock, FaUsers, FaFire, FaHeart } from 'react-icons/fa';
import axios from 'axios';
import { Link } from 'react-router-dom';

const DailyContainer = styled(motion.div)`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
`;

const PageHeader = styled(motion.div)`
  text-align: center;
  margin-bottom: 3rem;
  
  .page-title {
    font-size: 3rem;
    font-weight: 700;
    color: ${props => props.theme.colors.primary};
    background: ${props => props.theme.colors.gradient};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;

    @supports not (-webkit-background-clip: text) {
      color: ${props => props.theme.colors.primary};
      background: none;
    }

    .title-icon {
      color: #ffd700;
      animation: pulse 2s ease-in-out infinite;
    }
  }
`;

const RecipeCard = styled(motion.div)`
  background: white;
  border-radius: ${props => props.theme.borderRadius};
  overflow: hidden;
  box-shadow: ${props => props.theme.shadows.card};
  
  .recipe-image {
    width: 100%;
    height: 400px;
    object-fit: cover;
  }
  
  .recipe-content {
    padding: 2rem;
    
    .recipe-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: ${props => props.theme.colors.textDark};
    }
    
    .recipe-description {
      font-size: 1.2rem;
      color: ${props => props.theme.colors.textLight};
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    
    .recipe-meta {
      display: flex;
      gap: 2rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      
      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: ${props => props.theme.colors.textLight};
        
        .meta-icon {
          color: ${props => props.theme.colors.primary};
        }

        .rating-star {
          color: ${props => props.theme.colors.gold};
        }
      }
    }
    
    .cta-button {
      background: ${props => props.theme.colors.gradient};
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 25px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: ${props => props.theme.transitions.default};
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: ${props => props.theme.shadows.cardHover};
      }
    }
  }
`;

const LoadingWrapper = styled.div`
  text-align: center;
  padding: 4rem;
`;

const LoadingSpinner = styled(motion.div)`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const DailyRecipe = () => {
  const [dailyRecipe, setDailyRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDailyRecipe = async () => {
      try {
        const response = await axios.get('/api/recipes/daily/featured');
        setDailyRecipe(response.data);
      } catch (error) {
        console.error('Error fetching daily recipe:', error);
        setDailyRecipe({
          _id: '1',
          name: 'Leftover Vegetable Stir Fry',
          description: 'A quick and delicious way to use up leftover vegetables with a perfect blend of Asian flavors.',
          image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&h=400&fit=crop',
          readyInMinutes: 18,
          servings: 4,
          difficulty: 'Easy',
          rating: 4.5
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDailyRecipe();
  }, []);

  if (loading) {
    return (
      <DailyContainer>
        <LoadingWrapper>
          <LoadingSpinner
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            🍳
          </LoadingSpinner>
          <p>Loading today's featured recipe...</p>
        </LoadingWrapper>
      </DailyContainer>
    );
  }

  const title = dailyRecipe?.title || dailyRecipe?.name || 'Featured Recipe';
  const description = dailyRecipe?.summary || dailyRecipe?.description || '';
  const totalMinutes = (
    dailyRecipe?.readyInMinutes ??
    ((dailyRecipe?.prepTime || 0) + (dailyRecipe?.cookTime || 0)) ||
    30
  );
  const servings = dailyRecipe?.servings || 4;
  const difficulty = dailyRecipe?.difficulty || 'Easy';
  const rating = dailyRecipe?.rating;
  const imageSrc = dailyRecipe?.image;
  const detailLink = dailyRecipe?._id ? `/recipe/${dailyRecipe._id}` : '/smart-finder';

  return (
    <DailyContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <PageHeader
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <h1 className="page-title">
          <FaStar className="title-icon" />
          Recipe of the Day
        </h1>
      </PageHeader>

      {dailyRecipe && (
        <RecipeCard
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          {imageSrc && (
            <motion.img
              src={imageSrc}
              alt={title}
              className="recipe-image"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            />
          )}
          
          <div className="recipe-content">
            <div className="recipe-title">{title}</div>
            {description && (
              <div className="recipe-description">{description}</div>
            )}
            
            <div className="recipe-meta">
              <div className="meta-item">
                <FaClock className="meta-icon" />
                <span>{totalMinutes} min</span>
              </div>
              <div className="meta-item">
                <FaUsers className="meta-icon" />
                <span>{servings} servings</span>
              </div>
              <div className="meta-item">
                <FaFire className="meta-icon" />
                <span>{difficulty}</span>
              </div>
              {typeof rating === 'number' && (
                <div className="meta-item">
                  <FaStar className="meta-icon rating-star" />
                  <span>{rating}/5</span>
                </div>
              )}
            </div>
            
            <Link to={detailLink} className="cta-button">
              <FaHeart />
              View Full Recipe
            </Link>
          </div>
        </RecipeCard>
      )}
    </DailyContainer>
  );
};

export default DailyRecipe;