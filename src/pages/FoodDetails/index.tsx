import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  thumbnail_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // (OK) Load a specific food with extras based on routeParams id
      const response = await api.get(`foods/${routeParams.id}`);

      const loadedFood = response.data as Food;

      loadedFood.extras.map(extra => {
        extra.quantity = 0;
        return extra;
      });

      setFood(loadedFood);
      setExtras(loadedFood.extras);

      const favoritesResponse = await api.get('favorites');

      const favorites = favoritesResponse.data as Food[];

      if (favorites.find(item => item.id === loadedFood.id)) {
        setIsFavorite(true);
      } else {
        setIsFavorite(false);
      }
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // (OK) Increment extra quantity
    const extraIndex = extras.findIndex(extra => extra.id === id);

    const updatedExtras = [...extras];

    updatedExtras[extraIndex].quantity += 1;

    setExtras(updatedExtras);
  }

  function handleDecrementExtra(id: number): void {
    // (OK) Decrement extra quantity
    const extraIndex = extras.findIndex(extra => extra.id === id);

    if (extras[extraIndex].quantity <= 0) {
      return;
    }

    const updatedExtras = [...extras];

    updatedExtras[extraIndex].quantity -= 1;

    setExtras(updatedExtras);
  }

  function handleIncrementFood(): void {
    // (OK) Increment food quantity
    setFoodQuantity(foodQuantity + 1);
  }

  function handleDecrementFood(): void {
    // (OK) Decrement food quantity
    if (foodQuantity <= 1) {
      return;
    }

    setFoodQuantity(foodQuantity - 1);
  }

  const toggleFavorite = useCallback(async () => {
    // (OK) Toggle if food is favorite or not

    if (isFavorite) {
      await api.delete(`favorites/${food.id}`);
      setIsFavorite(false);
    } else {
      await api.post('/favorites', food);
      setIsFavorite(true);
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // (OK) Calculate cartTotal
    const foodTotal = food.price * foodQuantity;

    const extrasTotal = extras.reduce((acc, cur) => {
      return acc + cur.value * cur.quantity;
    }, 0);

    return formatValue(foodTotal + extrasTotal);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // (OK) Finish the order and save on the API
    const orderedExtras = [...extras.filter(extra => extra.quantity > 0)];

    const { id: product_id, name, description, price, thumbnail_url } = food;

    const orderObject = {
      extras: orderedExtras,
      product_id,
      name,
      description,
      price,
      thumbnail_url,
    };

    const response = await api.post('/orders', orderObject);

    console.log(response.data);
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
