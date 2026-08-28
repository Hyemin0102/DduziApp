import React, {useState, useEffect, useRef} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {Calendar, LocaleConfig} from 'react-native-calendars';
import Icon from 'react-native-vector-icons/Feather';

LocaleConfig.locales['ko'] = {
  monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  dayNames: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'],
  dayNamesShort: ['일','월','화','수','목','금','토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'ko';

type Props = {
  visible: boolean;
  mode: 'single' | 'range';
  initialDate?: string;
  initialStart?: string;
  initialEnd?: string;
  title?: string;
  maxDate?: string;
  onConfirm: (result: {date?: string; startDate?: string; endDate?: string}) => void;
  onClose: () => void;
};

// ─── 날짜 헬퍼 ───────────────────────────────────────────────

function toLocalDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildRangeMarked(start: string, end: string) {
  const marked: Record<string, any> = {};
  const cur = new Date(start + 'T00:00:00');
  const endD = new Date(end + 'T00:00:00');
  while (cur <= endD) {
    const dateStr = toLocalDateStr(cur);
    const isStart = dateStr === start;
    const isEnd = dateStr === end;
    marked[dateStr] = {
      color: isStart || isEnd ? '#191919' : '#e8e8e8',
      textColor: isStart || isEnd ? '#fff' : '#191919',
      startingDay: isStart,
      endingDay: isEnd,
    };
    cur.setDate(cur.getDate() + 1);
  }
  return marked;
}

// ─── 커스텀 날짜 셀: 시작일/종료일을 완전한 원으로, 중간 날짜는 연결된 바 배경으로 ───

function DayCell({date, state, marking, onPress}: any) {
  if (!date) return <View style={dayCell.cell} />;

  const m: any = marking || {};
  const isStart = !!m.startingDay;
  const isEnd = !!m.endingDay;
  const isRangeEndpoint = isStart || isEnd;
  const isSingleSelected = !!m.selected;
  const showCircle = isRangeEndpoint || isSingleSelected;
  const circleColor = isSingleSelected ? m.selectedColor || '#191919' : '#191919';
  const hasBar = m.color !== undefined && !(isStart && isEnd);
  const isDisabled = state === 'disabled' || state === 'inactive';
  const isToday = state === 'today';

  const textStyle = showCircle
    ? dayCell.textOnCircle
    : hasBar
      ? {color: m.textColor ?? '#191919'}
      : isDisabled
        ? dayCell.textDisabled
        : isToday
          ? dayCell.textToday
          : dayCell.textDefault;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(date)}
      style={dayCell.cell}>
      {hasBar && (
        <View
          style={[
            dayCell.bar,
            {
              backgroundColor: m.color,
              left: isStart ? '50%' : 0,
              right: isEnd ? '50%' : 0,
            },
          ]}
        />
      )}
      <View style={[dayCell.circle, showCircle && {backgroundColor: circleColor}]}>
        <Text style={[dayCell.text, textStyle]}>{date.day}</Text>
      </View>
    </TouchableOpacity>
  );
}

const dayCell = StyleSheet.create({
  cell: {
    width: '100%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    position: 'absolute',
    top: 3,
    bottom: 3,
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {fontSize: 15},
  textDefault: {color: '#2d4150'},
  textDisabled: {color: '#d9e1e8'},
  textToday: {color: '#555'},
  textOnCircle: {color: '#fff'},
});

// ─── 휠 피커 컬럼 ────────────────────────────────────────────

const ITEM_H = 48;
const VISIBLE_COUNT = 5;
const YEARS = Array.from({length: 16}, (_, i) => 2015 + i);
const MONTHS = Array.from({length: 12}, (_, i) => i + 1);

function WheelColumn({
  items,
  labels,
  initialIndex,
  onSelect,
}: {
  items: number[];
  labels: string[];
  initialIndex: number;
  onSelect: (index: number) => void;
}) {
  const ref = useRef<ScrollView>(null);
  const [centerIdx, setCenterIdx] = useState(initialIndex);

  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.scrollTo({y: initialIndex * ITEM_H, animated: false});
    }, 80);
    return () => clearTimeout(t);
  }, []);

  const handleEnd = (e: any) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const c = Math.max(0, Math.min(items.length - 1, i));
    setCenterIdx(c);
    onSelect(c);
  };

  return (
    <View style={wheel.col}>
      <ScrollView
        ref={ref}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingVertical: ITEM_H * 2}}
        onMomentumScrollEnd={handleEnd}
        onScrollEndDrag={handleEnd}>
        {labels.map((label, index) => (
          <TouchableOpacity
            key={label}
            activeOpacity={0.7}
            style={wheel.item}
            onPress={() => {
              ref.current?.scrollTo({y: index * ITEM_H, animated: true});
              setCenterIdx(index);
              onSelect(index);
            }}>
            <Text style={[wheel.text, index === centerIdx && wheel.textActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const wheel = StyleSheet.create({
  col: {flex: 1, height: ITEM_H * VISIBLE_COUNT},
  item: {height: ITEM_H, justifyContent: 'center', alignItems: 'center'},
  text: {fontSize: 17, color: '#ccc'},
  textActive: {fontSize: 18, fontWeight: '700', color: '#191919'},
});

// ─── CalendarModal ───────────────────────────────────────────

export default function CalendarModal({
  visible,
  mode,
  initialDate,
  initialStart,
  initialEnd,
  title,
  maxDate,
  onConfirm,
  onClose,
}: Props) {
  const {height: screenHeight} = useWindowDimensions();
  const [selected, setSelected] = useState(initialDate ?? '');
  const [rangeStart, setRangeStart] = useState(initialStart ?? '');
  const [rangeEnd, setRangeEnd] = useState(initialEnd ?? '');
  const [pickingEnd, setPickingEnd] = useState(false);

  // 캘린더가 보여주는 현재 월 (키 변경 시 리마운트로 이동)
  const [calendarKey, setCalendarKey] = useState('init');
  const [calendarCurrent, setCalendarCurrent] = useState<string | undefined>();

  // 휠 피커
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    if (visible) {
      const today = toLocalDateStr(new Date());
      setSelected(mode === 'single' ? (initialDate || today) : '');
      setRangeStart(mode === 'range' ? (initialStart || today) : '');
      setRangeEnd(initialEnd ?? '');
      setPickingEnd(!!(initialStart && !initialEnd));
      setShowPicker(false);

      const ref = initialDate || initialStart || today;
      setCalendarCurrent(ref);
      setCalendarKey(ref);
    }
  }, [visible]);

  const handleDayPress = (day: {dateString: string}) => {
    if (mode === 'single') {
      setSelected(day.dateString);
      return;
    }
    if (!rangeStart || !pickingEnd) {
      setRangeStart(day.dateString);
      setRangeEnd('');
      setPickingEnd(true);
    } else {
      if (day.dateString < rangeStart) {
        setRangeStart(day.dateString);
        setRangeEnd('');
      } else {
        setRangeEnd(day.dateString);
        setPickingEnd(false);
      }
    }
  };

  const markedDates =
    mode === 'single'
      ? selected
        ? {[selected]: {selected: true, selectedColor: '#191919'}}
        : {}
      : rangeStart && rangeEnd
        ? buildRangeMarked(rangeStart, rangeEnd)
        : rangeStart
          ? {[rangeStart]: {startingDay: true, endingDay: true, color: '#191919', textColor: '#fff'}}
          : {};

  const handleConfirm = () => {
    if (mode === 'single') {
      onConfirm({date: selected || undefined});
    } else {
      onConfirm({startDate: rangeStart || undefined, endDate: rangeEnd || undefined});
    }
  };

  const formatDisplay = (d: string) => {
    if (!d) return '미선택';
    const [y, m, day] = d.split('-');
    return `${y}. ${parseInt(m)}. ${parseInt(day)}.`;
  };

  const handlePickerConfirm = () => {
    const mm = String(pickerMonth).padStart(2, '0');
    const next = `${pickerYear}-${mm}-01`;
    setCalendarCurrent(next);
    setCalendarKey(next);
    setShowPicker(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={[styles.sheet, {height: screenHeight * 0.65}]}>
          {/* 상단 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Text style={styles.headerClose}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {title ?? (mode === 'single' ? '시작일 선택' : '기간 선택')}
            </Text>
            <TouchableOpacity
              onPress={handleConfirm}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Text style={styles.headerConfirm}>✓</Text>
            </TouchableOpacity>
          </View>

          {/* 달력 + 휠 피커 오버레이 */}
          <View style={styles.calendarCard}>

            <Calendar
              key={calendarKey}
              current={calendarCurrent}
              onDayPress={handleDayPress}
              markedDates={markedDates}
              markingType={mode === 'range' ? 'period' : 'dot'}
              dayComponent={DayCell}
              maxDate={maxDate}
              renderHeader={(date: any) => {
                const d = new Date(date);
                const y = d.getFullYear();
                const m = d.getMonth() + 1;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setPickerYear(y);
                      setPickerMonth(m);
                      setShowPicker(true);
                    }}
                    style={styles.monthHeaderBtn}>
                    <Text style={styles.monthHeader}>{y}년 {m}월</Text>
                    <Icon name="chevron-down" size={16} color="#555" />
                  </TouchableOpacity>
                );
              }}
              theme={{
                todayTextColor: '#555',
                arrowColor: '#191919',
                selectedDayBackgroundColor: '#191919',
                selectedDayTextColor: '#fff',
                textDayFontSize: 15,
                textMonthFontSize: 15,
                textDayHeaderFontSize: 12,
                textMonthFontWeight: '700',
              }}
            />

            {/* 휠 피커 오버레이 */}
            {showPicker && (
              <View style={styles.pickerOverlay}>
                <View style={styles.pickerRow}>
                  {/* 선택 영역 표시선: pickerRow 기준 절대 위치 */}
                  <View style={styles.pickerIndicator} pointerEvents="none" />
                  <WheelColumn
                    items={YEARS}
                    labels={YEARS.map(y => `${y}년`)}
                    initialIndex={Math.max(0, YEARS.indexOf(pickerYear))}
                    onSelect={i => setPickerYear(YEARS[i])}
                  />
                  <WheelColumn
                    items={MONTHS}
                    labels={MONTHS.map(m => `${m}월`)}
                    initialIndex={pickerMonth - 1}
                    onSelect={i => setPickerMonth(i + 1)}
                  />
                </View>

                <View style={styles.pickerActions}>
                  <TouchableOpacity
                    style={styles.pickerCancel}
                    onPress={() => setShowPicker(false)}>
                    <Text style={styles.pickerCancelText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pickerConfirm}
                    onPress={handlePickerConfirm}>
                    <Text style={styles.pickerConfirmText}>확인</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* 선택된 날짜 표시 */}
          <View style={styles.selectedBar}>
            {mode === 'single' ? (
              <>
                <Text style={styles.selectedLabel}>선택됨</Text>
                <Text style={styles.selectedDate}>
                  {selected ? formatDisplay(selected) : '날짜를 선택하세요'}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.selectedLabel}>기간</Text>
                <Text style={styles.selectedDate}>
                  {`${rangeStart ? formatDisplay(rangeStart) : '시작일'}  ~  ${rangeEnd ? formatDisplay(rangeEnd) : '종료일'}`}
                </Text>
              </>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#f5f5f5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerClose: {fontSize: 18, color: '#555'},
  headerTitle: {fontSize: 16, fontWeight: '600', color: '#111'},
  headerConfirm: {fontSize: 20, color: '#191919', fontWeight: '600'},
  calendarCard: {
    flex: 1,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  monthHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthHeader: {fontSize: 15, fontWeight: '700', color: '#191919'},
  selectedBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  selectedLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#191919',
  },
  selectedDate: {
    fontSize: 15,
    color: '#aaa',
  },

  // ─── 휠 피커 오버레이 ───────────────────────────────────────
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    borderRadius: 16,
    justifyContent: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    position: 'relative',
  },
  pickerIndicator: {
    position: 'absolute',
    top: ITEM_H * 2,
    left: 24,
    right: 24,
    height: ITEM_H,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  pickerCancel: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  pickerCancelText: {fontSize: 14, color: '#555'},
  pickerConfirm: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#191919',
  },
  pickerConfirmText: {fontSize: 14, color: '#fff', fontWeight: '600'},
});
