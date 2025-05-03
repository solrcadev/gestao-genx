import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CalendarDays, ChevronRight, Edit, LineChart, Phone, Mail } from 'lucide-react';
import { HistoricoTreinosAtleta } from '@/components/atleta/HistoricoTreinosAtleta';
import { supabase } from '@/lib/supabase';
import { Athlete } from '@/types';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { PerformanceRadarChart } from '@/components/charts/PerformanceRadarChart';
import { PerformanceLineChart } from '@/components/charts/PerformanceLineChart';
import { PerformanceBarChart } from '@/components/charts/PerformanceBarChart';
import { PerformanceMetricCard } from '@/components/performance/PerformanceMetricCard';
import { PerformanceOverviewCard } from '@/components/performance/PerformanceOverviewCard';
import { PerformanceHistoryTable } from '@/components/performance/PerformanceHistoryTable';
import { PerformanceGoalCard } from '@/components/performance/PerformanceGoalCard';
import { PerformanceComparisonCard } from '@/components/performance/PerformanceComparisonCard';
import { PerformanceImprovementCard } from '@/components/performance/PerformanceImprovementCard';
import { PerformanceRecommendationCard } from '@/components/performance/PerformanceRecommendationCard';
import { PerformanceStrengthWeaknessCard } from '@/components/performance/PerformanceStrengthWeaknessCard';
import { PerformanceAttendanceCard } from '@/components/performance/PerformanceAttendanceCard';
import { PerformanceProgressCard } from '@/components/performance/PerformanceProgressCard';
import { PerformanceSkillCard } from '@/components/performance/PerformanceSkillCard';
import { PerformanceTrainingCard } from '@/components/performance/PerformanceTrainingCard';
import { PerformanceCompetitionCard } from '@/components/performance/PerformanceCompetitionCard';
import { PerformanceInjuryCard } from '@/components/performance/PerformanceInjuryCard';
import { PerformanceNutritionCard } from '@/components/performance/PerformanceNutritionCard';
import { PerformanceSleepCard } from '@/components/performance/PerformanceSleepCard';
import { PerformanceStressCard } from '@/components/performance/PerformanceStressCard';
import { PerformanceRecoveryCard } from '@/components/performance/PerformanceRecoveryCard';
import { PerformanceFeedbackCard } from '@/components/performance/PerformanceFeedbackCard';
import { PerformanceGoalProgressCard } from '@/components/performance/PerformanceGoalProgressCard';
import { PerformanceTrainingLoadCard } from '@/components/performance/PerformanceTrainingLoadCard';
import { PerformanceTrainingVolumeCard } from '@/components/performance/PerformanceTrainingVolumeCard';
import { PerformanceTrainingIntensityCard } from '@/components/performance/PerformanceTrainingIntensityCard';
import { PerformanceTrainingFrequencyCard } from '@/components/performance/PerformanceTrainingFrequencyCard';
import { PerformanceTrainingDurationCard } from '@/components/performance/PerformanceTrainingDurationCard';
import { PerformanceTrainingTypeCard } from '@/components/performance/PerformanceTrainingTypeCard';
import { PerformanceTrainingZoneCard } from '@/components/performance/PerformanceTrainingZoneCard';
import { PerformanceTrainingPaceCard } from '@/components/performance/PerformanceTrainingPaceCard';
import { PerformanceTrainingPowerCard } from '@/components/performance/PerformanceTrainingPowerCard';
import { PerformanceTrainingHeartRateCard } from '@/components/performance/PerformanceTrainingHeartRateCard';
import { PerformanceTrainingCadenceCard } from '@/components/performance/PerformanceTrainingCadenceCard';
import { PerformanceTrainingSpeedCard } from '@/components/performance/PerformanceTrainingSpeedCard';
import { PerformanceTrainingDistanceCard } from '@/components/performance/PerformanceTrainingDistanceCard';
import { PerformanceTrainingTimeCard } from '@/components/performance/PerformanceTrainingTimeCard';
import { PerformanceTrainingCaloriesCard } from '@/components/performance/PerformanceTrainingCaloriesCard';
import { PerformanceTrainingElevationCard } from '@/components/performance/PerformanceTrainingElevationCard';
import { PerformanceTrainingGradeCard } from '@/components/performance/PerformanceTrainingGradeCard';
import { PerformanceTrainingTemperatureCard } from '@/components/performance/PerformanceTrainingTemperatureCard';
import { PerformanceTrainingHumidityCard } from '@/components/performance/PerformanceTrainingHumidityCard';
import { PerformanceTrainingWindCard } from '@/components/performance/PerformanceTrainingWindCard';
import { PerformanceTrainingPressureCard } from '@/components/performance/PerformanceTrainingPressureCard';
import { PerformanceTrainingWeatherCard } from '@/components/performance/PerformanceTrainingWeatherCard';
import { PerformanceTrainingTerrainCard } from '@/components/performance/PerformanceTrainingTerrainCard';
import { PerformanceTrainingEquipmentCard } from '@/components/performance/PerformanceTrainingEquipmentCard';
import { PerformanceTrainingClothingCard } from '@/components/performance/PerformanceTrainingClothingCard';
import { PerformanceTrainingShoeCard } from '@/components/performance/PerformanceTrainingShoeCard';
import { PerformanceTrainingDeviceCard } from '@/components/performance/PerformanceTrainingDeviceCard';
import { PerformanceTrainingSensorCard } from '@/components/performance/PerformanceTrainingSensorCard';
import { PerformanceTrainingAppCard } from '@/components/performance/PerformanceTrainingAppCard';
import { PerformanceTrainingPlatformCard } from '@/components/performance/PerformanceTrainingPlatformCard';
import { PerformanceTrainingCoachCard } from '@/components/performance/PerformanceTrainingCoachCard';
import { PerformanceTrainingPartnerCard } from '@/components/performance/PerformanceTrainingPartnerCard';
import { PerformanceTrainingGroupCard } from '@/components/performance/PerformanceTrainingGroupCard';
import { PerformanceTrainingTeamCard } from '@/components/performance/PerformanceTrainingTeamCard';
import { PerformanceTrainingClubCard } from '@/components/performance/PerformanceTrainingClubCard';
import { PerformanceTrainingLeagueCard } from '@/components/performance/PerformanceTrainingLeagueCard';
import { PerformanceTrainingAssociationCard } from '@/components/performance/PerformanceTrainingAssociationCard';
import { PerformanceTrainingFederationCard } from '@/components/performance/PerformanceTrainingFederationCard';
import { PerformanceTrainingOrganizationCard } from '@/components/performance/PerformanceTrainingOrganizationCard';
import { PerformanceTrainingEventCard } from '@/components/performance/PerformanceTrainingEventCard';
import { PerformanceTrainingRaceCard } from '@/components/performance/PerformanceTrainingRaceCard';
import { PerformanceTrainingCompetitionCard } from '@/components/performance/PerformanceTrainingCompetitionCard';
import { PerformanceTrainingTournamentCard } from '@/components/performance/PerformanceTrainingTournamentCard';
import { PerformanceTrainingChampionshipCard } from '@/components/performance/PerformanceTrainingChampionshipCard';
import { PerformanceTrainingCupCard } from '@/components/performance/PerformanceTrainingCupCard';
import { PerformanceTrainingSeriesCard } from '@/components/performance/PerformanceTrainingSeriesCard';
import { PerformanceTrainingSeasonCard } from '@/components/performance/PerformanceTrainingSeasonCard';
import { PerformanceTrainingYearCard } from '@/components/performance/PerformanceTrainingYearCard';
import { PerformanceTrainingDecadeCard } from '@/components/performance/PerformanceTrainingDecadeCard';
import { PerformanceTrainingCareerCard } from '@/components/performance/PerformanceTrainingCareerCard';
import { PerformanceTrainingLifetimeCard } from '@/components/performance/PerformanceTrainingLifetimeCard';
import { PerformanceTrainingHistoryCard } from '@/components/performance/PerformanceTrainingHistoryCard';
import { PerformanceTrainingFutureCard } from '@/components/performance/PerformanceTrainingFutureCard';
import { PerformanceTrainingPresentCard } from '@/components/performance/PerformanceTrainingPresentCard';
import { PerformanceTrainingPastCard } from '@/components/performance/PerformanceTrainingPastCard';
import { PerformanceTrainingNowCard } from '@/components/performance/PerformanceTrainingNowCard';
import { PerformanceTrainingThenCard } from '@/components/performance/PerformanceTrainingThenCard';
import { PerformanceTrainingWhenCard } from '@/components/performance/PerformanceTrainingWhenCard';
import { PerformanceTrainingWhereCard } from '@/components/performance/PerformanceTrainingWhereCard';
import { PerformanceTrainingWhoCard } from '@/components/performance/PerformanceTrainingWhoCard';
import { PerformanceTrainingWhatCard } from '@/components/performance/PerformanceTrainingWhatCard';
import { PerformanceTrainingWhyCard } from '@/components/performance/PerformanceTrainingWhyCard';
import { PerformanceTrainingHowCard } from '@/components/performance/PerformanceTrainingHowCard';
import { PerformanceTrainingWhichCard } from '@/components/performance/PerformanceTrainingWhichCard';
import { PerformanceTrainingWhetherCard } from '@/components/performance/PerformanceTrainingWhetherCard';
import { PerformanceTrainingIfCard } from '@/components/performance/PerformanceTrainingIfCard';
import { PerformanceTrainingElseCard } from '@/components/performance/PerformanceTrainingElseCard';
import { PerformanceTrainingThenElseCard } from '@/components/performance/PerformanceTrainingThenElseCard';
import { PerformanceTrainingIfElseCard } from '@/components/performance/PerformanceTrainingIfElseCard';
import { PerformanceTrainingIfThenElseCard } from '@/components/performance/PerformanceTrainingIfThenElseCard';
import { PerformanceTrainingIfThenCard } from '@/components/performance/PerformanceTrainingIfThenCard';
import { PerformanceTrainingIfWhenCard } from '@/components/performance/PerformanceTrainingIfWhenCard';
import { PerformanceTrainingIfWhereCard } from '@/components/performance/PerformanceTrainingIfWhereCard';
import { PerformanceTrainingIfWhoCard } from '@/components/performance/PerformanceTrainingIfWhoCard';
import { PerformanceTrainingIfWhatCard } from '@/components/performance/PerformanceTrainingIfWhatCard';
import { PerformanceTrainingIfWhyCard } from '@/components/performance/PerformanceTrainingIfWhyCard';
import { PerformanceTrainingIfHowCard } from '@/components/performance/PerformanceTrainingIfHowCard';
import { PerformanceTrainingIfWhichCard } from '@/components/performance/PerformanceTrainingIfWhichCard';
import { PerformanceTrainingIfWhetherCard } from '@/components/performance/PerformanceTrainingIfWhetherCard';
import { PerformanceTrainingIfThenWhenCard } from '@/components/performance/PerformanceTrainingIfThenWhenCard';
import { PerformanceTrainingIfThenWhereCard } from '@/components/performance/PerformanceTrainingIfThenWhereCard';
import { PerformanceTrainingIfThenWhoCard } from '@/components/performance/PerformanceTrainingIfThenWhoCard';
import { PerformanceTrainingIfThenWhatCard } from '@/components/performance/PerformanceTrainingIfThenWhatCard';
import { PerformanceTrainingIfThenWhyCard } from '@/components/performance/PerformanceTrainingIfThenWhyCard';
import { PerformanceTrainingIfThenHowCard } from '@/components/performance/PerformanceTrainingIfThenHowCard';
import { PerformanceTrainingIfThenWhichCard } from '@/components/performance/PerformanceTrainingIfThenWhichCard';
import { PerformanceTrainingIfThenWhetherCard } from '@/components/performance/PerformanceTrainingIfThenWhetherCard';
import { PerformanceTrainingIfElseWhenCard } from '@/components/performance/PerformanceTrainingIfElseWhenCard';
import { PerformanceTrainingIfElseWhereCard } from '@/components/performance/PerformanceTrainingIfElseWhereCard';
import { PerformanceTrainingIfElseWhoCard } from '@/components/performance/PerformanceTrainingIfElseWhoCard';
import { PerformanceTrainingIfElseWhatCard } from '@/components/performance/PerformanceTrainingIfElseWhatCard';
import { PerformanceTrainingIfElseWhyCard } from '@/components/performance/PerformanceTrainingIfElseWhyCard';
import { PerformanceTrainingIfElseHowCard } from '@/components/performance/PerformanceTrainingIfElseHowCard';
import { PerformanceTrainingIfElseWhichCard } from '@/components/performance/PerformanceTrainingIfElseWhichCard';
import { PerformanceTrainingIfElseWhetherCard } from '@/components/performance/PerformanceTrainingIfElseWhetherCard';
import { PerformanceTrainingIfThenElseWhenCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenCard';
import { PerformanceTrainingIfThenElseWhereCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereCard';
import { PerformanceTrainingIfThenElseWhoCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoCard';
import { PerformanceTrainingIfThenElseWhatCard } from '@/components/performance/PerformanceTrainingIfThenElseWhatCard';
import { PerformanceTrainingIfThenElseWhyCard } from '@/components/performance/PerformanceTrainingIfThenElseWhyCard';
import { PerformanceTrainingIfThenElseHowCard } from '@/components/performance/PerformanceTrainingIfThenElseHowCard';
import { PerformanceTrainingIfThenElseWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhichCard';
import { PerformanceTrainingIfThenElseWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereCard';
import { PerformanceTrainingIfThenElseWhenWhoCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoCard';
import { PerformanceTrainingIfThenElseWhenWhatCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhatCard';
import { PerformanceTrainingIfThenElseWhenWhyCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhyCard';
import { PerformanceTrainingIfThenElseWhenHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenHowCard';
import { PerformanceTrainingIfThenElseWhenWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhichCard';
import { PerformanceTrainingIfThenElseWhenWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhoCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoCard';
import { PerformanceTrainingIfThenElseWhereWhatCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhatCard';
import { PerformanceTrainingIfThenElseWhereWhyCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhyCard';
import { PerformanceTrainingIfThenElseWhereHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereHowCard';
import { PerformanceTrainingIfThenElseWhereWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhichCard';
import { PerformanceTrainingIfThenElseWhereWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhetherCard';
import { PerformanceTrainingIfThenElseWhoWhatCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhatCard';
import { PerformanceTrainingIfThenElseWhoWhyCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhyCard';
import { PerformanceTrainingIfThenElseWhoHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoHowCard';
import { PerformanceTrainingIfThenElseWhoWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhichCard';
import { PerformanceTrainingIfThenElseWhoWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhetherCard';
import { PerformanceTrainingIfThenElseWhatWhyCard } from '@/components/performance/PerformanceTrainingIfThenElseWhatWhyCard';
import { PerformanceTrainingIfThenElseWhatHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhatHowCard';
import { PerformanceTrainingIfThenElseWhatWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhatWhichCard';
import { PerformanceTrainingIfThenElseWhatWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhatWhetherCard';
import { PerformanceTrainingIfThenElseWhyHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhyHowCard';
import { PerformanceTrainingIfThenElseWhyWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhyWhichCard';
import { PerformanceTrainingIfThenElseWhyWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhyWhetherCard';
import { PerformanceTrainingIfThenElseHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseHowWhichCard';
import { PerformanceTrainingIfThenElseHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseHowWhetherCard';
import { PerformanceTrainingIfThenElseWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoCard';
import { PerformanceTrainingIfThenElseWhenWhereWhatCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhatCard';
import { PerformanceTrainingIfThenElseWhenWhereWhyCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhyCard';
import { PerformanceTrainingIfThenElseWhenWhereHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereHowCard';
import { PerformanceTrainingIfThenElseWhenWhereWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhichCard';
import { PerformanceTrainingIfThenElseWhenWhereWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhoWhatCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhatCard';
import { PerformanceTrainingIfThenElseWhenWhoWhyCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhyCard';
import { PerformanceTrainingIfThenElseWhenWhoHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoHowCard';
import { PerformanceTrainingIfThenElseWhenWhoWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhichCard';
import { PerformanceTrainingIfThenElseWhenWhoWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhatWhyCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhatWhyCard';
import { PerformanceTrainingIfThenElseWhenWhatHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhatHowCard';
import { PerformanceTrainingIfThenElseWhenWhatWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhatWhichCard';
import { PerformanceTrainingIfThenElseWhenWhatWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhatWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhyHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhyHowCard';
import { PerformanceTrainingIfThenElseWhenWhyWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhyWhichCard';
import { PerformanceTrainingIfThenElseWhenWhyWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhyWhetherCard';
import { PerformanceTrainingIfThenElseWhenHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenHowWhichCard';
import { PerformanceTrainingIfThenElseWhenHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenHowWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhoWhatCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhatCard';
import { PerformanceTrainingIfThenElseWhereWhoWhyCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhyCard';
import { PerformanceTrainingIfThenElseWhereWhoHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoHowCard';
import { PerformanceTrainingIfThenElseWhereWhoWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhichCard';
import { PerformanceTrainingIfThenElseWhereWhoWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhatWhyCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhatWhyCard';
import { PerformanceTrainingIfThenElseWhereWhatHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhatHowCard';
import { PerformanceTrainingIfThenElseWhereWhatWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhatWhichCard';
import { PerformanceTrainingIfThenElseWhereWhatWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhatWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhyHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhyHowCard';
import { PerformanceTrainingIfThenElseWhereWhyWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhyWhichCard';
import { PerformanceTrainingIfThenElseWhereWhyWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhyWhetherCard';
import { PerformanceTrainingIfThenElseWhereHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereHowWhichCard';
import { PerformanceTrainingIfThenElseWhereHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereHowWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhoWhatWhyCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhatWhyCard';
import { PerformanceTrainingIfThenElseWhoWhatHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhatHowCard';
import { PerformanceTrainingIfThenElseWhoWhatWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhatWhichCard';
import { PerformanceTrainingIfThenElseWhoWhatWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhatWhetherCard';
import { PerformanceTrainingIfThenElseWhoWhyHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhyHowCard';
import { PerformanceTrainingIfThenElseWhoWhyWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhyWhichCard';
import { PerformanceTrainingIfThenElseWhoWhyWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhyWhetherCard';
import { PerformanceTrainingIfThenElseWhoHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoHowWhichCard';
import { PerformanceTrainingIfThenElseWhoHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoHowWhetherCard';
import { PerformanceTrainingIfThenElseWhoWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhatWhyHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhatWhyHowCard';
import { PerformanceTrainingIfThenElseWhatWhyWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhatWhyWhichCard';
import { PerformanceTrainingIfThenElseWhatWhyWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhatWhyWhetherCard';
import { PerformanceTrainingIfThenElseWhatHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhatHowWhichCard';
import { PerformanceTrainingIfThenElseWhatHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhatHowWhetherCard';
import { PerformanceTrainingIfThenElseWhatWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhatWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhyHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhyHowWhichCard';
import { PerformanceTrainingIfThenElseWhyHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhyHowWhetherCard';
import { PerformanceTrainingIfThenElseWhyWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhyWhichWhetherCard';
import { PerformanceTrainingIfThenElseHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhatCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhatCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhyCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhyCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoHowCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhichCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhatWhyCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhatWhyCard';
import { PerformanceTrainingIfThenElseWhenWhereWhatHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhatHowCard';
import { PerformanceTrainingIfThenElseWhenWhereWhatWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhatWhichCard';
import { PerformanceTrainingIfThenElseWhenWhereWhatWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhatWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhyHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhyHowCard';
import { PerformanceTrainingIfThenElseWhenWhereWhyWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhyWhichCard';
import { PerformanceTrainingIfThenElseWhenWhereWhyWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhyWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereHowWhichCard';
import { PerformanceTrainingIfThenElseWhenWhereHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereHowWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhoWhatWhyCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhatWhyCard';
import { PerformanceTrainingIfThenElseWhenWhoWhatHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhatHowCard';
import { PerformanceTrainingIfThenElseWhenWhoWhatWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhatWhichCard';
import { PerformanceTrainingIfThenElseWhenWhoWhatWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhatWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhoWhyHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhyHowCard';
import { PerformanceTrainingIfThenElseWhenWhoWhyWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhyWhichCard';
import { PerformanceTrainingIfThenElseWhenWhoWhyWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhyWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhoHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoHowWhichCard';
import { PerformanceTrainingIfThenElseWhenWhoHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoHowWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhoWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhatWhyHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhatWhyHowCard';
import { PerformanceTrainingIfThenElseWhenWhatWhyWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhatWhyWhichCard';
import { PerformanceTrainingIfThenElseWhenWhatWhyWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhatWhyWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhatHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhatHowWhichCard';
import { PerformanceTrainingIfThenElseWhenWhatHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhatHowWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhatWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhatWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhyHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhyHowWhichCard';
import { PerformanceTrainingIfThenElseWhenWhyHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhyHowWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhyWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhyWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhoWhatWhyCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhatWhyCard';
import { PerformanceTrainingIfThenElseWhereWhoWhatHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhatHowCard';
import { PerformanceTrainingIfThenElseWhereWhoWhatWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhatWhichCard';
import { PerformanceTrainingIfThenElseWhereWhoWhatWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhatWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhoWhyHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhyHowCard';
import { PerformanceTrainingIfThenElseWhereWhoWhyWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhyWhichCard';
import { PerformanceTrainingIfThenElseWhereWhoWhyWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhyWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhoHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoHowWhichCard';
import { PerformanceTrainingIfThenElseWhereWhoHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoHowWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhoWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhatWhyHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhatWhyHowCard';
import { PerformanceTrainingIfThenElseWhereWhatWhyWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhatWhyWhichCard';
import { PerformanceTrainingIfThenElseWhereWhatWhyWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhatWhyWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhatHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhatHowWhichCard';
import { PerformanceTrainingIfThenElseWhereWhatHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhatHowWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhatWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhatWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhyHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhyHowWhichCard';
import { PerformanceTrainingIfThenElseWhereWhyHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhyHowWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhyWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhyWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhereHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhoWhatWhyHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhatWhyHowCard';
import { PerformanceTrainingIfThenElseWhoWhatWhyWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhatWhyWhichCard';
import { PerformanceTrainingIfThenElseWhoWhatWhyWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhatWhyWhetherCard';
import { PerformanceTrainingIfThenElseWhoWhatHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhatHowWhichCard';
import { PerformanceTrainingIfThenElseWhoWhatHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhatHowWhetherCard';
import { PerformanceTrainingIfThenElseWhoWhatWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhatWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhoWhyHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhyHowWhichCard';
import { PerformanceTrainingIfThenElseWhoWhyHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhyHowWhetherCard';
import { PerformanceTrainingIfThenElseWhoWhyWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhyWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhoHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhatWhyHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhatWhyHowWhichCard';
import { PerformanceTrainingIfThenElseWhatWhyHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhatWhyHowWhetherCard';
import { PerformanceTrainingIfThenElseWhatWhyWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhatWhyWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhatHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhatHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhyHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhyHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhatWhyCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhatWhyCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhatHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhatHowCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhatWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhatWhichCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhatWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhatWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhyHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhyHowCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhyWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhyWhichCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhyWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhyWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoHowWhichCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoHowWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhatWhyHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhatWhyHowCard';
import { PerformanceTrainingIfThenElseWhenWhereWhatWhyWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhatWhyWhichCard';
import { PerformanceTrainingIfThenElseWhenWhereWhatWhyWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhatWhyWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhatHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhatHowWhichCard';
import { PerformanceTrainingIfThenElseWhenWhereWhatHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhatHowWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhatWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhatWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhyHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhyHowWhichCard';
import { PerformanceTrainingIfThenElseWhenWhereWhyHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhyHowWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhyWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhyWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhoWhatWhyHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhatWhyHowCard';
import { PerformanceTrainingIfThenElseWhenWhoWhatWhyWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhatWhyWhichCard';
import { PerformanceTrainingIfThenElseWhenWhoWhatWhyWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhatWhyWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhoWhatHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhatHowWhichCard';
import { PerformanceTrainingIfThenElseWhenWhoWhatHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhatHowWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhoWhatWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhatWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhoWhyHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhyHowWhichCard';
import { PerformanceTrainingIfThenElseWhenWhoWhyHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhyHowWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhoWhyWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhyWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhoHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhatWhyHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhatWhyHowWhichCard';
import { PerformanceTrainingIfThenElseWhenWhatWhyHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhatWhyHowWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhatWhyWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhatWhyWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhatHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhatHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhyHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhyHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhoWhatWhyHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhatWhyHowCard';
import { PerformanceTrainingIfThenElseWhereWhoWhatWhyWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhatWhyWhichCard';
import { PerformanceTrainingIfThenElseWhereWhoWhatWhyWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhatWhyWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhoWhatHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhatHowWhichCard';
import { PerformanceTrainingIfThenElseWhereWhoWhatHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhatHowWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhoWhatWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhatWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhoWhyHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhyHowWhichCard';
import { PerformanceTrainingIfThenElseWhereWhoWhyHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhyHowWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhoWhyWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhyWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhoHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhatWhyHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhatWhyHowWhichCard';
import { PerformanceTrainingIfThenElseWhereWhatWhyHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhatWhyHowWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhatWhyWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhatWhyWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhatHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhatHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhyHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhyHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhoWhatWhyHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhatWhyHowWhichCard';
import { PerformanceTrainingIfThenElseWhoWhatWhyHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhatWhyHowWhetherCard';
import { PerformanceTrainingIfThenElseWhoWhatWhyWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhatWhyWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhoWhatHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhatHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhoWhyHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhyHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhatWhyHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhatWhyHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhatWhyHowCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhatWhyHowCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhatWhyWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhatWhyWhichCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhatWhyWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhatWhyWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhatHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhatHowWhichCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhatHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhatHowWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhatWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhatWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhyHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhyHowWhichCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhyHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhyHowWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhyWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhyWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhatWhyHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhatWhyHowWhichCard';
import { PerformanceTrainingIfThenElseWhenWhereWhatWhyHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhatWhyHowWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhatWhyWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhatWhyWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhatHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhatHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhyHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhyHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhoWhatWhyHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhatWhyHowWhichCard';
import { PerformanceTrainingIfThenElseWhenWhoWhatWhyHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhatWhyHowWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhoWhatWhyWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhatWhyWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhoWhatHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhatHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhoWhyHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhyHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhatWhyHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhatWhyHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhoWhatWhyHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhatWhyHowWhichCard';
import { PerformanceTrainingIfThenElseWhereWhoWhatWhyHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhatWhyHowWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhoWhatWhyWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhatWhyWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhoWhatHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhatHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhoWhyHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhyHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhatWhyHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhatWhyHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhoWhatWhyHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhoWhatWhyHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhatWhyHowWhichCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhatWhyHowWhichCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhatWhyHowWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhatWhyHowWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhatWhyWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhatWhyWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhatHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhatHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhyHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhyHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhatWhyHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhatWhyHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhoWhatWhyHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhoWhatWhyHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhereWhoWhatWhyHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhereWhoWhatWhyHowWhichWhetherCard';
import { PerformanceTrainingIfThenElseWhenWhereWhoWhatWhyHowWhichWhetherCard } from '@/components/performance/PerformanceTrainingIfThenElseWhenWhereWhoWhatWhyHowWhichWhetherCard';

const AthleteDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch athlete data
  const { data: athlete, isLoading } = useQuery<Athlete>({
    queryKey: ['athlete', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch athlete performance data
  const { data: performance, isLoading: isLoadingPerformance } = useQuery({
    queryKey: ['athlete-performance', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athlete_performance')
        .select('*')
        .eq('athlete_id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }
      
      return data || null;
    },
    enabled: !!id,
  });

  // Fetch athlete training history
  const { data: trainingHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['athlete-training-history', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athlete_training_history')
        .select(`
          treino_id,
          treino_nome,
          data,
          local,
          presente,
          justificativa,
          fundamentos:athlete_training_fundamentos(
            fundamento,
            pontuacao,
            total_eventos,
            acertos,
            erros
          )
        `)
        .eq('athlete_id', id)
        .order('data', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match the expected format
      return data.map(item => ({
        treinoId: item.treino_id,
        nomeTreino: item.treino_nome,
        data: item.data,
        local: item.local,
        presenca: item.presente,
        justificativa: item.justificativa,
        fundamentos: item.fundamentos.map(f => ({
          fundamento: f.fundamento,
          pontuacao: f.pontuacao,
          totalEventos: f.total_eventos,
          acertos: f.acertos,
          erros: f.erros
        }))
      }));
    },
    enabled: !!id,
  });

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (e) {
      return "Data inválida";
    }
  };

  // Calculate age from birthdate
  const calculateAge = (birthdate: string) => {
    if (!birthdate) return null;
    
    try {
      const birth = new Date(birthdate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    } catch (e) {
      return null;
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-8 w-64 ml-2" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                <Skeleton className="h-6 w-32 mx-auto mt-4" />
                <Skeleton className="h-4 w-24 mx-auto mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold ml-2">Atleta não encontrado</h1>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">O atleta solicitado não foi encontrado ou não existe.</p>
            <Button onClick={() => navigate('/atletas')}>
              Voltar para lista de atletas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold ml-2">Perfil do Atleta</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Athlete Profile Card */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="flex flex-col items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={athlete.foto_url || athlete.imagem_url || ''} alt={athlete.nome} />
                <AvatarFallback className={`text-xl ${athlete.time === 'Masculino' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                  {getInitials(athlete.nome)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="mt-4 text-center">{athlete.nome}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={athlete.time === 'Masculino' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-pink-50 text-pink-800 border-pink-200'}>
                  {athlete.time}
                </Badge>
                <Badge variant="outline" className="bg-gray-50">
                  {athlete.posicao || 'Sem posição'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {athlete.idade} anos • {athlete.altura}cm
                  </span>
                </div>
                
                {athlete.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{athlete.email}</span>
                  </div>
                )}
                
                {athlete.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{athlete.telefone}</span>
                  </div>
                )}
                
                <div className="pt-4 flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={() => navigate(`/aluno/${athlete.id}/performance`)}
                  >
                    <LineChart className="mr-2 h-4 w-4" />
                    Ver Desempenho Completo
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => navigate(`/editar-atleta/${athlete.id}`)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Perfil
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="history">Histórico de Treinos</TabsTrigger>
              <TabsTrigger value="performance">Desempenho</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="space-y-6">
                {/* Performance Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo de Desempenho</CardTitle>
                    <CardDescription>
                      Visão geral do desempenho do atleta nos treinos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingPerformance ? (
                      <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-40 w-full" />
                      </div>
                    ) : performance ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <PerformanceMetricCard 
                          title="Frequência"
                          value={`${performance.frequencia}%`}
                          description="Presença nos treinos"
                          trend={performance.frequencia > 75 ? 'up' : 'down'}
                        />
                        
                        <PerformanceMetricCard 
                          title="Evolução"
                          value={`${performance.evolucao > 0 ? '+' : ''}${performance.evolucao}%`}
                          description="Nos últimos 30 dias"
                          trend={performance.evolucao > 0 ? 'up' : 'down'}
                        />
                        
                        <PerformanceMetricCard 
                          title="Eficiência"
                          value={`${performance.eficiencia}%`}
                          description="Média de acertos"
                          trend={performance.eficiencia > 70 ? 'up' : 'down'}
                        />
                        
                        <div className="md:col-span-3">
                          <PerformanceChart data={performance.grafico_evolucao || []} />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">
                          Não há dados de desempenho disponíveis para este atleta.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Recent Training History */}
                <Card>
                  <CardHeader>
                    <CardTitle>Últimos Treinos</CardTitle>
                    <CardDescription>
                      Participação recente em treinos e atividades
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingHistory ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : trainingHistory && trainingHistory.length > 0 ? (
                      <div className="space-y-2">
                        {trainingHistory.slice(0, 3).map((training, index) => (
                          <div 
                            key={index} 
                            className="flex justify-between items-center p-3 border rounded-md hover:bg-accent/50 transition-colors"
                          >
                            <div>
                              <p className="font-medium">{training.nomeTreino}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="h-3.5 w-3.5" />
                                <span>{formatDate(training.data)}</span>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Badge className={training.presenca ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {training.presenca ? 'Presente' : 'Ausente'}
                              </Badge>
                              <ChevronRight className="h-5 w-5 ml-2 text-muted-foreground" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground">
                          Não há histórico de treinos disponível para este atleta.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              {isLoadingHistory ? (
                <Card>
                  <CardContent className="py-6">
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-64" />
                      <Skeleton className="h-64 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ) : trainingHistory && trainingHistory.length > 0 ? (
                <HistoricoTreinosAtleta historico={trainingHistory} />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      Não há histórico de treinos disponível para este atleta.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="performance">
              {isLoadingPerformance ? (
                <div className="space-y-6">
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : performance ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Desempenho por Fundamento</CardTitle>
                      <CardDescription>
                        Análise detalhada do desempenho em cada fundamento
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <PerformanceRadarChart data={performance.fundamentos || []} />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Evolução de Desempenho</CardTitle>
                      <CardDescription>
                        Progresso ao longo do tempo nos principais fundamentos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <PerformanceLineChart data={performance.evolucao_fundamentos || []} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">
                      Não há dados de desempenho disponíveis para este atleta.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AthleteDetails;
