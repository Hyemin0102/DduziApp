import React from 'react';
import {ScrollView} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';
import {ExploreStackParamList} from '@/@types/navigation';
import {EXPLORE_ROUTES} from '@/constants/navigation.constant';
import * as S from './PatternDetailScreen.style';

type PatternNotesRouteProp = RouteProp<
  ExploreStackParamList,
  typeof EXPLORE_ROUTES.PATTERN_NOTES
>;

export default function PatternNotesScreen() {
  const {params} = useRoute<PatternNotesRouteProp>();

  return (
    <S.Container>
      <ScrollView>
        <S.Content>
          <S.Description>{params.notes}</S.Description>
        </S.Content>
      </ScrollView>
    </S.Container>
  );
}
