import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* <Text style={styles.title}>개인정보처리방침</Text>
      <Text style={styles.date}>시행일: 2025년 4월 6일</Text> */}

      <Text style={styles.body}>
        Hyemin Jo(이하 "개발자")는 개인정보 보호법 등 관련 법령에 따라 이용자의 개인정보를 보호하고, 이와 관련한 고충을 신속하게 처리하기 위하여 다음과 같이 개인정보처리방침을 수립·공개합니다.
      </Text>

      <Text style={styles.sectionTitle}>제1조 (수집하는 개인정보 항목 및 수집 방법)</Text>
      <Text style={styles.subTitle}>카카오 로그인</Text>
      <Text style={styles.body}>
        카카오 로그인 이용 시 아래 항목을 수집합니다.{'\n'}
        • 필수: 닉네임, 프로필 사진, 카카오 계정(이메일)
      </Text>
      <Text style={styles.subTitle}>구글 로그인</Text>
      <Text style={styles.body}>
        구글 로그인 이용 시 구글에서 기본 제공하는 정보(이름, 이메일, 프로필 사진)를 수집할 수 있습니다.
      </Text>
      <Text style={styles.subTitle}>애플 로그인</Text>
      <Text style={styles.body}>
        애플 로그인 이용 시 애플에서 기본 제공하는 정보(이름, 이메일)를 수집할 수 있습니다. 애플의 정책에 따라 이메일이 비공개(relay) 이메일로 제공될 수 있습니다.
      </Text>
      <Text style={styles.subTitle}>수집 방법</Text>
      <Text style={styles.body}>
        개인정보는 이용자가 소셜 로그인을 통해 서비스에 접속할 때 해당 소셜 플랫폼으로부터 제공받는 방식으로 수집됩니다.
      </Text>

      <Text style={styles.sectionTitle}>제2조 (개인정보의 수집 및 이용 목적)</Text>
      <Text style={styles.body}>
        수집된 개인정보는 다음의 목적을 위해 이용됩니다.{'\n'}
        • 회원 식별 및 서비스 제공: 로그인 인증, 계정 관리{'\n'}
        • 서비스 개선: 서비스 품질 개선을 위한 이용 현황 분석{'\n'}
        • 고객 지원: 이용자의 문의 및 불만 처리
      </Text>

      <Text style={styles.sectionTitle}>제3조 (개인정보의 보유 및 이용 기간)</Text>
      <Text style={styles.body}>
        개발자는 이용자의 개인정보를 서비스 이용 기간 동안 보유·이용합니다. 이용자가 계정 삭제를 요청하거나 서비스 탈퇴 시 해당 개인정보는 지체 없이 파기됩니다.{'\n\n'}
        단, 다음의 경우 법령에서 정한 기간 동안 보관합니다.{'\n'}
        • 소비자 불만 또는 분쟁처리 기록 (전자상거래법): 3년{'\n'}
        • 서비스 이용 관련 로그 기록 (통신비밀보호법): 3개월
      </Text>

      <Text style={styles.sectionTitle}>제4조 (개인정보의 제3자 제공)</Text>
      <Text style={styles.body}>
        개발자는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만 아래의 경우는 예외입니다.{'\n'}
        • 이용자가 사전에 동의한 경우{'\n'}
        • 법령의 규정에 따라 수사기관의 요구가 있는 경우
      </Text>

      <Text style={styles.sectionTitle}>제5조 (개인정보 처리의 위탁)</Text>
      <Text style={styles.body}>
        현재 개발자는 서비스 운영을 위해 개인정보 처리 업무를 외부에 위탁하고 있지 않습니다. 향후 위탁이 필요한 경우 이용자에게 사전 고지하겠습니다.
      </Text>

      <Text style={styles.sectionTitle}>제6조 (이용자 권리 및 행사 방법)</Text>
      <Text style={styles.body}>
        이용자는 개인정보 주체로서 언제든지 다음의 권리를 행사할 수 있습니다.{'\n'}
        • 개인정보 열람 요청{'\n'}
        • 오류 등이 있을 경우 정정 요청{'\n'}
        • 삭제 요청 (앱 내 계정 삭제 기능을 통해 직접 삭제 가능){'\n'}
        • 처리 정지 요청{'\n\n'}
        위 권리 행사는 이메일(hyeminjo0102@gmail.com)로 연락하시면 지체 없이 조치하겠습니다.
      </Text>

      <Text style={styles.sectionTitle}>제7조 (개인정보의 파기 절차 및 방법)</Text>
      <Text style={styles.body}>
        개발자는 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.{'\n'}
        • 전자적 파일: 복원이 불가능한 방법으로 영구 삭제{'\n'}
        • 기타 기록물: 분쇄하거나 소각하여 파기
      </Text>

      <Text style={styles.sectionTitle}>제8조 (개인정보 보호를 위한 기술적·관리적 조치)</Text>
      <Text style={styles.body}>
        개발자는 이용자의 개인정보 보호를 위해 다음과 같은 조치를 취하고 있습니다.{'\n'}
        • 개인정보에 대한 접근 제한 및 접근 권한 관리{'\n'}
        • 개인정보를 안전하게 저장·전송하기 위한 암호화 기술 적용
      </Text>

      <Text style={styles.sectionTitle}>제9조 (만 14세 미만 아동의 개인정보 처리)</Text>
      <Text style={styles.body}>
        본 서비스는 만 14세 미만 아동을 대상으로 하지 않으며, 만 14세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다.
      </Text>

      <Text style={styles.sectionTitle}>제10조 (개인정보 보호 책임자 및 문의)</Text>
      <Text style={styles.body}>
        이용자의 개인정보 관련 문의, 불만 처리, 피해 구제 등을 위해 개인정보 보호 책임자를 지정합니다.{'\n'}
        • 성명: Hyemin Jo{'\n'}
        • 이메일: hyeminjo0102@gmail.com
      </Text>

      <Text style={styles.sectionTitle}>제11조 (권익침해 구제 방법)</Text>
      <Text style={styles.body}>
        개인정보 침해로 인한 신고나 상담이 필요하신 경우 아래 기관에 문의하시기 바랍니다.{'\n'}
        • 개인정보 침해신고센터: (국번없이) 118 (privacy.kisa.or.kr){'\n'}
        • 개인정보 분쟁조정위원회: 1833-6972 (www.kopico.go.kr){'\n'}
        • 대검찰청 사이버수사과: (국번없이) 1301{'\n'}
        • 경찰청 사이버안전국: (국번없이) 182
      </Text>

      <View style={styles.footer}>
        <Text style={styles.footerText}>본 개인정보처리방침은 2025년 4월 6일부터 시행됩니다.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#191919',
  },
  date: {
    fontSize: 13,
    color: '#888',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
    color: '#191919',
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
    color: '#333',
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: '#444',
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    fontSize: 13,
    color: '#888',
  },
});
