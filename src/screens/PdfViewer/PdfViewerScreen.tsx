import React, {useEffect, useState} from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Pdf from 'react-native-pdf';
import RNFS from 'react-native-fs';
import {RouteProp, useRoute} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ProjectsStackParamList} from '@/@types/navigation';
import {PROJECTS_ROUTES} from '@/constants/navigation.constant';
import useCommonNavigation from '@/hooks/useCommonNavigation';
import Icon from 'react-native-vector-icons/Feather';
import {getSignedPdfUrl} from '@/lib/uploadPdf';

type RouteProps = RouteProp<ProjectsStackParamList, typeof PROJECTS_ROUTES.PDF_VIEWER>;

export default function PdfViewerScreen() {
  const route = useRoute<RouteProps>();
  const {navigation} = useCommonNavigation<any>();
  const {pdfUrl, pdfPath, title} = route.params;

  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(
    pdfPath ? null : pdfUrl ?? null,
  );

  const loadSignedUrl = () => {
    if (!pdfPath) return;
    getSignedPdfUrl(pdfPath).then(async url => {
      if (!url) {
        setError(true);
        return;
      }
      // react-native-pdf가 원격 https URL을 받으면 Android에서 react-native-blob-util의
      // 다운로드 완료 판정 버그로 "Download interrupted"가 나서, 직접 로컬로 받아 file:// 경로로 넘김
      try {
        const localPath = `${RNFS.CachesDirectoryPath}/pattern_${Date.now()}.pdf`;
        await RNFS.downloadFile({fromUrl: url, toFile: localPath}).promise;
        setResolvedUrl(`file://${localPath}`);
      } catch (e) {
        console.error('PDF 다운로드 실패:', e);
        setError(true);
      }
    });
  };

  useEffect(loadSignedUrl, [pdfPath]);

  const source = {uri: resolvedUrl ?? '', cache: true};

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
          <TouchableOpacity
            onPress={() => {
              setError(false);
              loadSignedUrl();
            }}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : !resolvedUrl ? (
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color="#191919" />
        </View>
      ) : (
        <Pdf
          source={source}
          style={styles.pdf}
          trustAllCerts={false}
          onLoadComplete={pages => setTotalPages(pages)}
          onPageChanged={page => setCurrentPage(page)}
          onError={e => {
            console.error('PDF 로드 에러:', e);
            setError(true);
          }}
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
