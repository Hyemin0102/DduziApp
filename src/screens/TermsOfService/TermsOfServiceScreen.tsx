import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

export default function TermsOfServiceScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* <Text style={styles.title}>서비스 이용약관</Text> */}
      {/* <Text style={styles.date}>시행일: 2025년 4월 6일</Text> */}

      <Text style={styles.sectionTitle}>제1조 (목적)</Text>
      <Text style={styles.body}>
        이 약관은 Hyemin Jo(이하 "개발자")가 제공하는 모바일 앱 서비스 "뜨지(Dduzi)"(이하 "서비스")의 이용 조건 및 절차, 개발자와 이용자 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
      </Text>

      <Text style={styles.sectionTitle}>제2조 (용어 정의)</Text>
      <Text style={styles.body}>
        • "서비스"란 개발자가 제공하는 뜨개질 관련 모바일 애플리케이션 뜨지(Dduzi) 및 이와 관련된 제반 서비스를 의미합니다.{'\n'}
        • "이용자"란 이 약관에 따라 서비스를 이용하는 모든 사용자를 의미합니다.{'\n'}
        • "계정"이란 이용자가 소셜 로그인(카카오, 구글, 애플)을 통해 서비스를 이용하기 위해 생성된 인증 정보를 의미합니다.
      </Text>

      <Text style={styles.sectionTitle}>제3조 (약관의 효력 및 변경)</Text>
      <Text style={styles.body}>
        본 약관은 서비스를 이용하고자 하는 모든 이용자에게 적용됩니다.{'\n\n'}
        개발자는 관련 법령에 위배되지 않는 범위 내에서 약관을 변경할 수 있으며, 변경 시 앱 내 공지 또는 이메일을 통해 사전 고지합니다. 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 계정을 삭제할 수 있습니다.
      </Text>

      <Text style={styles.sectionTitle}>제4조 (서비스 이용)</Text>
      <Text style={styles.subTitle}>이용 자격</Text>
      <Text style={styles.body}>
        본 서비스는 만 14세 이상의 이용자가 사용할 수 있습니다. 만 14세 미만의 이용자는 서비스를 이용할 수 없습니다.
      </Text>
      <Text style={styles.subTitle}>소셜 로그인</Text>
      <Text style={styles.body}>
        이용자는 카카오, 구글, 애플 계정을 통해 서비스에 로그인할 수 있습니다. 소셜 계정을 통한 로그인 시 해당 플랫폼의 이용약관 및 개인정보처리방침도 함께 적용됩니다.
      </Text>
      <Text style={styles.subTitle}>서비스 이용 제한</Text>
      <Text style={styles.body}>
        개발자는 다음 각 호에 해당하는 경우 이용자의 서비스 이용을 제한하거나 계정을 해지할 수 있습니다.{'\n'}
        • 타인의 정보를 도용하거나 허위 정보를 입력한 경우{'\n'}
        • 서비스 운영을 방해하거나 다른 이용자에게 피해를 주는 행위를 한 경우{'\n'}
        • 관련 법령 또는 이 약관을 위반한 경우
      </Text>

      <Text style={styles.sectionTitle}>제5조 (이용자의 의무)</Text>
      <Text style={styles.body}>
        이용자는 다음 행위를 하여서는 안 됩니다.{'\n'}
        • 서비스를 통해 음란, 폭력적인 메시지 등 공서양속에 반하는 정보를 게시하는 행위{'\n'}
        • 개발자 또는 타인의 저작권 등 지식재산권을 침해하는 행위{'\n'}
        • 서비스의 안정적인 운영을 방해할 수 있는 모든 행위{'\n'}
        • 기타 관계 법령에 위반된다고 판단되는 행위
      </Text>

      <Text style={styles.sectionTitle}>제6조 (서비스 중단)</Text>
      <Text style={styles.body}>
        개발자는 서비스 유지·보수, 교체 및 고장, 통신 두절 등의 사유로 서비스 제공이 일시적으로 중단될 수 있습니다. 이 경우 가능한 한 사전에 앱 내 공지를 통해 이용자에게 알립니다.
      </Text>

      <Text style={styles.sectionTitle}>제7조 (지식재산권)</Text>
      <Text style={styles.body}>
        서비스 내 개발자가 제공하는 콘텐츠(텍스트, 이미지, 디자인 등)에 대한 지식재산권은 개발자에게 있습니다. 이용자는 개발자의 사전 승낙 없이 이를 복제, 배포 등의 방법으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.
      </Text>

      <Text style={styles.sectionTitle}>제8조 (면책조항)</Text>
      <Text style={styles.body}>
        개발자는 천재지변 등 불가항력적 사유로 서비스를 제공할 수 없는 경우에는 책임이 면제됩니다.{'\n\n'}
        개발자는 이용자의 귀책사유로 인한 서비스 이용 장애 및 손해에 대하여 책임을 지지 않습니다.
      </Text>

      <Text style={styles.sectionTitle}>제9조 (준거법 및 관할)</Text>
      <Text style={styles.body}>
        이 약관의 해석 및 적용은 대한민국 법령에 따릅니다. 서비스 이용 중 발생한 분쟁에 관한 소는 개발자의 소재지를 관할하는 법원을 제1심 법원으로 합니다.
      </Text>

      <Text style={styles.sectionTitle}>제10조 (문의)</Text>
      <Text style={styles.body}>
        서비스 이용약관에 대한 문의는 아래 이메일로 연락해 주시기 바랍니다.{'\n'}
        이메일: hyeminjo0102@gmail.com
      </Text>

      <View style={styles.footer}>
        <Text style={styles.footerText}>본 약관은 2025년 4월 6일부터 시행됩니다.</Text>
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
