import React, {useState} from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Pdf from 'react-native-pdf';
import {RouteProp, useRoute} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ProjectsStackParamList} from '@/@types/navigation';
import {PROJECTS_ROUTES} from '@/constants/navigation.constant';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import Icon from 'react-native-vector-icons/Feather';

type RouteProps = RouteProp<ProjectsStackParamList, typeof PROJECTS_ROUTES.PDF_VIEWER>;

export default function PdfViewerScreen() {
  const route = useRoute<RouteProps>();
  const {navigation} = useCommonNavigation<any>();
  const {pdfUrl, title} = route.params;

  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(false);

  const source = {uri: pdfUrl, cache: true};

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-left" size={24} color="#191919" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{title || '도안 PDF'}</Text>
        <Text style={styles.pageInfo}>
          {totalPages > 0 ? `${currentPage} / ${totalPages}` : ''}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>PDF를 불러올 수 없어요.</Text>
          <TouchableOpacity onPress={() => setError(false)}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Pdf
          source={source}
          style={styles.pdf}
          onLoadComplete={pages => setTotalPages(pages)}
          onPageChanged={page => setCurrentPage(page)}
          onError={() => setError(true)}
          renderActivityIndicator={() => (
            <ActivityIndicator size="large" color="#191919" />
          )}
          enablePaging
          horizontal={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#191919',
  },
  pageInfo: {
    fontSize: 13,
    color: '#999999',
    marginLeft: 8,
  },
  pdf: {
    flex: 1,
    width: '100%',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    color: '#999999',
  },
  retryText: {
    fontSize: 14,
    color: '#191919',
    textDecorationLine: 'underline',
  },
});
