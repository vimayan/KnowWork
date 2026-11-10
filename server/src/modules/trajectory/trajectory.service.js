import { q } from '../../db/postgres.js';
import { cacheAside } from '../../db/redis.js';
import { config } from '../../config/index.js';
import { AppError } from '../../utils/response.js';

const TTL = config.redis.ttl.trajectory;

/** Full graph for a job card — nodes + edges for front-end rendering. */
export async function getTrajectoryGraph(jobCardId) {
  return cacheAside(`traj:graph:${jobCardId}`, async () => {
    const [nodes, edges] = await Promise.all([
      q(`SELECT id,label,level,employer_type,typical_exp_years,
                salary_min_inr,salary_max_inr,reach_probability_pct,
                avg_time_from_start_months,x_position,y_position,node_color,
                is_entry_point,is_terminal
         FROM career_nodes WHERE job_card_id=$1 ORDER BY avg_time_from_start_months NULLS LAST`,
        [jobCardId]),
      q(`SELECT ce.id,ce.from_node_id,ce.to_node_id,
                ce.transition_probability_pct,ce.avg_time_months,
                ce.edge_type,ce.salary_delta_pct,ce.is_common_path,
                ce.required_skills
         FROM career_edges ce
         JOIN career_nodes cn ON cn.id=ce.from_node_id
         WHERE cn.job_card_id=$1`,
        [jobCardId]),
    ]);
    return { nodes: nodes.rows, edges: edges.rows };
  }, TTL);
}

/** Outcomes at a specific node (for "what can happen next?" popup). */
export async function getNodeOutcomes(nodeId) {
  const { rows } = await q(
    `SELECT op.*,
            ce.to_node_id,cn.label AS next_label,cn.level AS next_level,
            cn.salary_min_inr AS next_salary_min,cn.salary_max_inr AS next_salary_max
     FROM outcome_probabilities op
     LEFT JOIN career_edges ce ON ce.from_node_id=$1 AND ce.to_node_id IS NOT NULL
     LEFT JOIN career_nodes cn ON cn.id=ce.to_node_id
     WHERE op.node_id=$1
     ORDER BY op.probability_pct DESC`,
    [nodeId],
  );
  return rows;
}

/** Compare named scenario paths side by side. */
export async function compareScenarios(jobCardId, trajectoryTypes) {
  const { rows } = await q(
    `SELECT ts.*,
            ARRAY(
              SELECT json_build_object('id',cn.id,'label',cn.label,'level',cn.level,
                       'salary_min',cn.salary_min_inr,'salary_max',cn.salary_max_inr,
                       'time',cn.avg_time_from_start_months)
              FROM career_nodes cn
              WHERE cn.id = ANY(ts.node_sequence)
            ) AS steps
     FROM trajectory_scenarios ts
     WHERE ts.job_card_id=$1 AND ts.trajectory_type=ANY($2)`,
    [jobCardId, trajectoryTypes],
  );
  return rows;
}

/** Failure map for a job card — failure nodes + social obstacles + survival paths. */
export async function getFailureMap(jobCardId) {
  return cacheAside(`fail:${jobCardId}`, async () => {
    const [failures, obstacles] = await Promise.all([
      q(`SELECT fm.*,
                ARRAY(SELECT row_to_json(sp) FROM survival_paths sp WHERE sp.failure_map_id=fm.id) AS survival_paths
         FROM failure_maps fm WHERE fm.job_card_id=$1 ORDER BY fm.probability_pct DESC NULLS LAST`,
        [jobCardId]),
      q(`SELECT * FROM social_obstacles WHERE job_card_id=$1 ORDER BY severity DESC`, [jobCardId]),
    ]);
    return { failures: failures.rows, obstacles: obstacles.rows };
  }, TTL);
}
