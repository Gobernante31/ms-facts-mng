import React from "react";
import {
  Paper,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Icon,
} from "@material-ui/core";
import { FuseAnimate, FusePageCarded } from "@fuse";
import { useQuery } from "@apollo/react-hooks";
import { Line, HorizontalBar } from "react-chartjs-2";
import { useSelector } from "react-redux";
import { MDText } from "i18n-react";
import i18n from "../i18n";
import { FactsMngSharkAttackDashboardStats } from "../gql/SharkAttack";

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  legend: { display: false },
  scales: {
    yAxes: [
      {
        ticks: { beginAtZero: true },
        gridLines: { color: "rgba(0,0,0,0.05)" },
      },
    ],
    xAxes: [{ gridLines: { display: false } }],
  },
};

const countryChartOptions = {
  ...chartOptions,
  scales: {
    xAxes: [
      {
        ticks: { beginAtZero: true },
        gridLines: { color: "rgba(0,0,0,0.05)" },
      },
    ],
    yAxes: [{ gridLines: { display: false } }],
  },
};

const COLORS = {
  primary: "#1976D2",
  secondary: "#388E3C",
  background: "rgba(25, 118, 210, 0.08)",
  cardBg: "#FFFFFF",
  textPrimary: "#1A1A2E",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
};

function Dashboard() {
  const user = useSelector(({ auth }) => auth.user);
  const locale = (user && user.locale) || "es-CO";
  const T = new MDText(i18n.get(locale));

  const { data, loading, error } = useQuery(
    FactsMngSharkAttackDashboardStats().query,
    { fetchPolicy: "network-only" },
  );

  if (loading) {
    return (
      <Box className="flex flex-1 items-center justify-center p-24">
        <CircularProgress color="primary" size={48} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="flex flex-1 items-center justify-center p-24">
        <Typography color="error" variant="h6">
          {T.translate("dashboard.error_loading") ||
            "Error al cargar el dashboard"}
        </Typography>
      </Box>
    );
  }

  const stats = (data && data.FactsMngSharkAttackDashboardStats) || {
    totalAttacks: 0,
    attacksByCountry: [],
    attacksByYear: [],
  };

  const byCountryData = {
    labels: stats.attacksByCountry.map((c) => c.country || "N/A").reverse(),
    datasets: [
      {
        label: T.translate("dashboard.attacks_by_country"),
        data: stats.attacksByCountry.map((c) => c.count).reverse(),
        backgroundColor: COLORS.primary,
        borderRadius: 4,
        maxBarThickness: 40,
      },
    ],
  };

  const byYearData = {
    labels: stats.attacksByYear.map((y) => y.year || "N/A"),
    datasets: [
      {
        label: T.translate("dashboard.attacks_by_year"),
        data: stats.attacksByYear.map((y) => y.count),
        fill: true,
        backgroundColor: COLORS.background,
        borderColor: COLORS.primary,
        borderWidth: 2,
        tension: 0.3,
        pointBackgroundColor: COLORS.primary,
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  return (
    <FusePageCarded
      classes={{
        toolbar: "p-0",
        header: "min-h-72 h-72 sm:h-96 sm:min-h-96",
        content: "bg-gray-50",
      }}
      header={
        <div className="flex flex-1 w-full items-center">
          <FuseAnimate animation="transition.slideRightIn" delay={300}>
            <div className="flex items-center">
              <FuseAnimate animation="transition.expandIn" delay={300}>
                <Icon className="text-32 sm:text-48 mr-12">dashboard</Icon>
              </FuseAnimate>

              <div className="flex flex-col">
                <Typography className="text-20 sm:text-24">
                  {T.translate("dashboard.title")}
                </Typography>

                <Typography variant="caption">
                  {T.translate("dashboard.subtitle")}
                </Typography>
              </div>
            </div>
          </FuseAnimate>
        </div>
      }
      content={
        <div className="w-full p-16 sm:p-24">
          <Grid container spacing={3}>
            {/* TOTAL DE ATAQUES */}
            <Grid item xs={12} sm={6} md={3}>
              <FuseAnimate animation="transition.expandIn" delay={200}>
                <div>
                  <Typography
                    component="h3"
                    className="font-semibold mb-8"
                    style={{
                      color: COLORS.textPrimary,
                      fontSize: "16px",
                      lineHeight: 1.4,
                    }}
                  >
                    {T.translate("dashboard.total_attacks")}
                  </Typography>

                  <Card
                    className="rounded-lg shadow-sm"
                    elevation={1}
                    style={{
                      backgroundColor: COLORS.cardBg,
                      border: `1px solid ${COLORS.border}`,
                    }}
                  >
                    <CardContent className="flex items-center justify-center py-32">
                      <Typography
                        component="div"
                        className="font-bold"
                        style={{
                          color: COLORS.primary,
                          fontSize: "48px",
                          lineHeight: 1,
                        }}
                      >
                        {stats.totalAttacks.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </div>
              </FuseAnimate>
            </Grid>

            {/* ATAQUES POR PAÍS */}
            <Grid item xs={12} md={9}>
              <FuseAnimate animation="transition.slideLeftIn" delay={300}>
                <div>
                  <Typography
                    component="h3"
                    className="font-semibold mb-8"
                    style={{
                      color: COLORS.textPrimary,
                      fontSize: "16px",
                      lineHeight: 1.4,
                    }}
                  >
                    {T.translate("dashboard.attacks_by_country")}
                  </Typography>

                  <Paper
                    className="rounded-lg shadow-sm"
                    elevation={1}
                    style={{
                      backgroundColor: COLORS.cardBg,
                      border: `1px solid ${COLORS.border}`,
                      padding: "16px 20px",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        height: 320,
                      }}
                    >
                      <HorizontalBar
                        data={byCountryData}
                        options={countryChartOptions}
                      />
                    </div>
                  </Paper>
                </div>
              </FuseAnimate>
            </Grid>

            {/* ATAQUES POR AÑO */}
            <Grid item xs={12}>
              <FuseAnimate animation="transition.slideUpIn" delay={400}>
                <div>
                  <Typography
                    component="h3"
                    className="font-semibold mb-8"
                    style={{
                      color: COLORS.textPrimary,
                      fontSize: "16px",
                      lineHeight: 1.4,
                    }}
                  >
                    {T.translate("dashboard.attacks_by_year")}
                  </Typography>

                  <Paper
                    className="rounded-lg shadow-sm"
                    elevation={1}
                    style={{
                      backgroundColor: COLORS.cardBg,
                      border: `1px solid ${COLORS.border}`,
                      padding: "16px 20px",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        height: 320,
                      }}
                    >
                      <Line data={byYearData} options={chartOptions} />
                    </div>
                  </Paper>
                </div>
              </FuseAnimate>
            </Grid>
          </Grid>
        </div>
      }
      innerScroll
    />
  );
}

export default Dashboard;
