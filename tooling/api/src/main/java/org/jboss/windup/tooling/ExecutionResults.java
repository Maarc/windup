package org.jboss.windup.tooling;

import org.jboss.windup.tooling.data.Classification;
import org.jboss.windup.tooling.data.Hint;
import org.jboss.windup.tooling.data.ReportLink;

import java.nio.file.Path;
import java.util.List;

/**
 * Contains the results of running Windup. This contains all {@link Classification}s, {@link Hint}s, and information about how to find the reports
 * that were produced.
 *
 * @author <a href="mailto:jesse.sightler@gmail.com">Jesse Sightler</a>
 */
public interface ExecutionResults
{
    /**
     * Contains all {@link Classification}s produced by this run of Windup.
     */
    List<Classification> getClassifications();

    /**
     * Contains all {@link Hint}s produced by this run of Windup.
     */
    List<Hint> getHints();

    /**
     * Contains information about all of the reports produced by Windup and how to find them.
     */
    List<ReportLink> getReportLinks();

    /**
     * Serialize the results to an XML file at the provided {@link Path}.
     */
    void serializeToXML(Path path);
}
